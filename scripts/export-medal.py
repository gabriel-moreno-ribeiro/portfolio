"""
BLENDER SCRIPT — Exporta medalha como GLB otimizado para o site.
================================================================
COMO USAR:
1. Abra o arquivo .blend com o modelo da medalha
2. No Blender: Edit > Preferences > File Paths > (nada precisa mudar)
3. Va na aba Scripting (topo) > Open > selecione este arquivo
4. Clique em "Run Script" (play)
5. Pronto — o .glb aparece em public/honors/medals/

CONFIGURACAO — mude o MEDAL_ID abaixo para cada medalha nova:
"""

import bpy
import os
import math

# ╔══════════════════════════════════════════╗
# ║  MUDE APENAS ISTO PARA CADA MEDALHA     ║
# ╠══════════════════════════════════════════╣
MEDAL_ID = "obfep"
# ╚══════════════════════════════════════════╝

EXPORT_DIR = r"C:\portfolio-gabriel\public\honors\medals"
EXPORT_PATH = os.path.join(EXPORT_DIR, f"{MEDAL_ID}.glb")

# --- Pega o objeto ---
obj = None
for o in bpy.context.scene.objects:
    if o.type == 'MESH':
        obj = o
        break

if not obj:
    raise RuntimeError("Nenhum mesh encontrado na cena!")

bpy.context.view_layer.objects.active = obj
obj.select_set(True)

# --- Reseta rotacao aplicada (aplica transforms) ---
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# --- Material: Metal Prata/Gunmetal ---
mat = bpy.data.materials.new(name=f"Medal_{MEDAL_ID}")
mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
nodes.clear()

bsdf = nodes.new("ShaderNodeBsdfPrincipled")
bsdf.location = (0, 0)
bsdf.inputs["Base Color"].default_value = (0.3, 0.3, 0.32, 1)
bsdf.inputs["Metallic"].default_value = 1.0
bsdf.inputs["Roughness"].default_value = 0.32

output = nodes.new("ShaderNodeOutputMaterial")
output.location = (300, 0)
links.new(bsdf.outputs["BSDF"], output.inputs["Surface"])

# Aplica material
obj.data.materials.clear()
obj.data.materials.append(mat)

# --- Decimate para reduzir peso (target 50k faces max) ---
face_count = len(obj.data.polygons)
if face_count > 50000:
    ratio = 50000 / face_count
    mod = obj.modifiers.new(name="Decimate", type='DECIMATE')
    mod.ratio = ratio
    bpy.ops.object.modifier_apply(modifier="Decimate")
    print(f"Decimated: {face_count} → ~50000 faces")

# --- Exporta GLB com Draco ---
os.makedirs(EXPORT_DIR, exist_ok=True)

bpy.ops.export_scene.gltf(
    filepath=EXPORT_PATH,
    export_format='GLB',
    use_selection=False,
    export_apply=True,
    export_image_format='JPEG',
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_materials='EXPORT',
)

file_size_mb = os.path.getsize(EXPORT_PATH) / (1024 * 1024)
print(f"\n{'='*50}")
print(f"✓ EXPORTADO: {EXPORT_PATH}")
print(f"✓ TAMANHO: {file_size_mb:.1f} MB")
print(f"{'='*50}")
