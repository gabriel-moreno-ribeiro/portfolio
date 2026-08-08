"""
MCP Server: auto_image_to_blender
Converts an image to 3D (via TripoSR on HuggingFace) and imports into Blender.

Usage:
    python scripts/image_to_3d_mcp.py

The server runs as stdio MCP. Configure in .mcp.json or ~/.claude/settings.json.
"""

import socket
import json
import tempfile
import base64
import logging
import os
import sys
import shutil
from pathlib import Path

from mcp.server.fastmcp import FastMCP

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("Image2BlenderMCP")

BLENDER_HOST = os.getenv("BLENDER_HOST", "localhost")
BLENDER_PORT = int(os.getenv("BLENDER_PORT", "9876"))

mcp = FastMCP("Image2Blender")


def send_to_blender(command_type: str, params: dict = None) -> dict:
    """Send a command to the Blender addon socket server."""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(120)
    sock.connect((BLENDER_HOST, BLENDER_PORT))
    msg = json.dumps({"type": command_type, "params": params or {}})
    sock.sendall(msg.encode("utf-8"))

    chunks = []
    while True:
        try:
            chunk = sock.recv(8192)
            if not chunk:
                break
            chunks.append(chunk)
            try:
                json.loads(b"".join(chunks))
                break
            except json.JSONDecodeError:
                continue
        except socket.timeout:
            break
    sock.close()

    data = b"".join(chunks)
    resp = json.loads(data.decode("utf-8"))
    if resp.get("status") == "error":
        raise Exception(resp.get("message", "Blender error"))
    return resp.get("result", {})


def image_to_glb(image_path: str, resolution: int = 256) -> str:
    """
    Send image to TripoSR HuggingFace Space and get back a GLB file path.
    Falls back to TRELLIS Space if available.
    """
    from gradio_client import Client

    logger.info(f"Connecting to TripoSR Space...")
    client = Client("stabilityai/TripoSR")

    logger.info(f"Preprocessing image: {image_path}")
    processed = client.predict(
        input_image=image_path,
        remove_background=True,
        foreground_ratio=0.85,
        api_name="/preprocess",
    )
    logger.info(f"Preprocessed image: {processed}")

    logger.info(f"Generating 3D model (resolution={resolution})...")
    obj_path, glb_path = client.predict(
        processed_image=processed,
        marching_cubes_resolution=resolution,
        api_name="/generate",
    )
    logger.info(f"Generated GLB: {glb_path}")

    return glb_path


def import_glb_in_blender(glb_path: str, name: str = "imported_model") -> dict:
    """Import a GLB file into Blender via the addon socket, center it at origin."""
    glb_path_escaped = glb_path.replace("\\", "/")

    code = f"""
import bpy

# Deselect all
bpy.ops.object.select_all(action='DESELECT')

# Import GLB
bpy.ops.import_scene.gltf(filepath=r"{glb_path_escaped}")

# Get imported objects
imported = [obj for obj in bpy.context.selected_objects]
if not imported:
    imported = [obj for obj in bpy.data.objects if obj.select_get()]

# Create empty parent for organization
bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
parent = bpy.context.active_object
parent.name = "{name}"

# Parent all imported objects and center
for obj in imported:
    obj.parent = parent

# Select all imported objects to compute bounding box
bpy.ops.object.select_all(action='DESELECT')
for obj in imported:
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

# Move geometry to world origin
bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
for obj in imported:
    obj.location = (0, 0, 0)

# Ensure material viewport display is set to MATERIAL
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        for space in area.spaces:
            if space.type == 'VIEW_3D':
                space.shading.type = 'MATERIAL'
                break

result = f"Imported {{len(imported)}} objects as '{name}'"
"""
    return send_to_blender("execute_code", {"code": code})


@mcp.tool()
def auto_image_to_blender(
    image_path: str,
    model_name: str = "imported_model",
    resolution: int = 256,
    save_glb_to: str = "",
) -> str:
    """
    Convert an image to a 3D model and import it into Blender automatically.

    Takes a photo/image file, runs it through TripoSR (image-to-3D AI),
    and imports the resulting GLB into the active Blender scene.

    Args:
        image_path: Path to the input image file (PNG, JPG, etc.)
        model_name: Name for the imported object in Blender (default: "imported_model")
        resolution: Marching cubes resolution for mesh detail (32-320, default: 256)
        save_glb_to: Optional path to save a copy of the GLB (e.g. "public/honors/medals/model.glb")

    Returns:
        Status message with details about the imported model.
    """
    image_path = os.path.abspath(image_path)

    if not os.path.isfile(image_path):
        return f"Error: Image file not found: {image_path}"

    logger.info(f"Starting image-to-3D pipeline for: {image_path}")

    # Step 1: Convert image to GLB via TripoSR
    try:
        glb_path = image_to_glb(image_path, resolution=resolution)
    except Exception as e:
        return f"Error during 3D generation: {str(e)}"

    # Step 2: Optionally save a copy
    if save_glb_to:
        save_path = os.path.abspath(save_glb_to)
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        shutil.copy2(glb_path, save_path)
        logger.info(f"Saved GLB copy to: {save_path}")

    # Step 3: Import into Blender
    try:
        result = import_glb_in_blender(glb_path, name=model_name)
    except Exception as e:
        # If Blender import fails, still report the GLB was generated
        msg = f"GLB generated at: {glb_path}"
        if save_glb_to:
            msg += f"\nSaved to: {save_glb_to}"
        msg += f"\nBlender import failed: {str(e)}"
        return msg

    # Step 4: Report success
    msg = f"Done! 3D model '{model_name}' imported into Blender."
    msg += f"\nSource: {image_path}"
    msg += f"\nGLB: {glb_path}"
    if save_glb_to:
        msg += f"\nCopy saved to: {save_glb_to}"
    msg += f"\nBlender result: {result}"
    return msg


@mcp.tool()
def image_to_glb_only(
    image_path: str,
    output_path: str = "",
    resolution: int = 256,
) -> str:
    """
    Convert an image to a 3D GLB file WITHOUT importing into Blender.

    Useful when you just want the GLB file for web use.

    Args:
        image_path: Path to the input image file
        output_path: Where to save the GLB (default: temp directory)
        resolution: Mesh detail level (32-320, default: 256)

    Returns:
        Path to the generated GLB file.
    """
    image_path = os.path.abspath(image_path)
    if not os.path.isfile(image_path):
        return f"Error: Image file not found: {image_path}"

    try:
        glb_path = image_to_glb(image_path, resolution=resolution)
    except Exception as e:
        return f"Error: {str(e)}"

    if output_path:
        output_path = os.path.abspath(output_path)
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        shutil.copy2(glb_path, output_path)
        return f"GLB saved to: {output_path}"

    return f"GLB generated at: {glb_path}"


def main():
    mcp.run(transport="stdio")


if __name__ == "__main__":
    main()
