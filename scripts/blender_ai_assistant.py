"""
BLENDER AI ASSISTANT — Addon que recebe comandos em português e executa no Blender via Claude API.
==================================================================================================
INSTALAÇÃO:
1. Abra o Blender
2. Edit > Preferences > Add-ons > Install from Disk
3. Selecione este arquivo (blender_ai_assistant.py)
4. Ative o addon "AI Assistant (Claude)"
5. No painel lateral (N), aba "AI Assistant", cole sua API key
6. Digite comandos em português e clique "Executar"

PRIMEIRO USO:
- Clique "Instalar anthropic" no painel (precisa de internet)
- Cole sua API key da Anthropic (https://console.anthropic.com/settings/keys)
"""

bl_info = {
    "name": "AI Assistant (Claude)",
    "author": "Gabriel Moreno",
    "version": (1, 0, 0),
    "blender": (4, 0, 0),
    "location": "View3D > Sidebar > AI Assistant",
    "description": "Assistente IA que executa comandos em português no Blender via Claude API",
    "category": "Development",
}

import bpy
import subprocess
import sys
import os
import traceback
from bpy.props import StringProperty, BoolProperty, EnumProperty


SYSTEM_PROMPT = """Você é um assistente especialista em Blender Python (bpy).
O usuário vai te dar comandos em português. Você deve responder APENAS com código Python executável no Blender.

REGRAS:
- Responda SOMENTE com código Python puro, sem markdown, sem ```python, sem explicações
- Use apenas módulos disponíveis no Blender (bpy, bmesh, mathutils, math, os)
- Sempre use bpy.context e bpy.data
- Se o comando pedir exportar GLB, use: bpy.ops.export_scene.gltf(filepath=PATH, export_format='GLB')
- O diretório de exportação de medalhas é: C:\\portfolio-gabriel\\public\\honors\\medals\\
- Se precisar selecionar objetos, use bpy.context.view_layer.objects.active
- Para materiais metálicos, use Principled BSDF com Metallic=1.0
- Sempre aplique transforms antes de exportar: bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
- Se o código falhar, o erro será mostrado ao usuário. Escreva código robusto.
- NÃO inclua imports que não existam no Blender
- NÃO use print() para output principal — use self.report se precisar reportar ao usuário

CONTEXTO DO PROJETO:
- Medalhas são exportadas como GLB para C:\\portfolio-gabriel\\public\\honors\\medals\\
- Material padrão é metal gunmetal: Base Color (0.3, 0.3, 0.32), Metallic 1.0, Roughness 0.32
- Decimate para max 50k faces antes de exportar
- Exportar com Draco compression level 6
- IDs de medalha existentes: obqjr, obfep"""


def get_anthropic_module():
    try:
        import anthropic
        return anthropic
    except ImportError:
        return None


class AI_OT_InstallDeps(bpy.types.Operator):
    bl_idname = "ai_assistant.install_deps"
    bl_label = "Instalar anthropic"
    bl_description = "Instala o pacote anthropic no Python do Blender"

    def execute(self, context):
        python = sys.executable
        try:
            subprocess.check_call([python, "-m", "pip", "install", "anthropic"])
            self.report({'INFO'}, "anthropic instalado com sucesso!")
        except subprocess.CalledProcessError as e:
            self.report({'ERROR'}, f"Erro ao instalar: {e}")
        return {'FINISHED'}


class AI_OT_Execute(bpy.types.Operator):
    bl_idname = "ai_assistant.execute"
    bl_label = "Executar"
    bl_description = "Envia o comando para o Claude e executa o código retornado"

    def execute(self, context):
        props = context.scene.ai_assistant

        if not props.api_key:
            self.report({'ERROR'}, "Cole sua API key primeiro!")
            return {'CANCELLED'}

        anthropic = get_anthropic_module()
        if anthropic is None:
            self.report({'ERROR'}, "Pacote anthropic não instalado. Clique 'Instalar anthropic'.")
            return {'CANCELLED'}

        if not props.command.strip():
            self.report({'ERROR'}, "Digite um comando!")
            return {'CANCELLED'}

        try:
            client = anthropic.Anthropic(api_key=props.api_key)

            messages = [{"role": "user", "content": props.command}]

            if props.last_error and props.auto_fix:
                messages = [
                    {"role": "user", "content": props.command},
                    {"role": "assistant", "content": props.last_code},
                    {"role": "user", "content": f"O código acima deu este erro:\n{props.last_error}\nCorreja o código."},
                ]

            response = client.messages.create(
                model=props.model,
                max_tokens=4096,
                system=SYSTEM_PROMPT,
                messages=messages,
            )

            code = response.content[0].text.strip()
            if code.startswith("```"):
                code = code.split("\n", 1)[1]
                if code.endswith("```"):
                    code = code[:-3]
                code = code.strip()

            props.last_code = code
            props.last_error = ""
            props.output = ""

            exec(code)

            props.output = "Executado com sucesso!"
            self.report({'INFO'}, "Comando executado com sucesso!")

        except anthropic.APIError as e:
            props.output = f"Erro API: {e.message}"
            self.report({'ERROR'}, f"Erro API: {e.message}")
        except Exception as e:
            error_msg = traceback.format_exc()
            props.last_error = error_msg
            props.output = f"Erro: {str(e)}"

            if props.auto_fix:
                self.report({'WARNING'}, f"Erro na execução, tentando corrigir...")
                bpy.ops.ai_assistant.execute()
            else:
                self.report({'ERROR'}, f"Erro: {str(e)}")

        return {'FINISHED'}


class AI_OT_ExportMedal(bpy.types.Operator):
    bl_idname = "ai_assistant.export_medal"
    bl_label = "Exportar Medalha"
    bl_description = "Aplica material metálico, decima e exporta como GLB otimizado"

    def execute(self, context):
        props = context.scene.ai_assistant
        medal_id = props.medal_id.strip().lower()

        if not medal_id:
            self.report({'ERROR'}, "Digite o ID da medalha!")
            return {'CANCELLED'}

        export_dir = r"C:\portfolio-gabriel\public\honors\medals"
        export_path = os.path.join(export_dir, f"{medal_id}.glb")

        obj = None
        for o in bpy.context.scene.objects:
            if o.type == 'MESH':
                obj = o
                break

        if not obj:
            self.report({'ERROR'}, "Nenhum mesh encontrado na cena!")
            return {'CANCELLED'}

        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

        mat = bpy.data.materials.new(name=f"Medal_{medal_id}")
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

        obj.data.materials.clear()
        obj.data.materials.append(mat)

        face_count = len(obj.data.polygons)
        if face_count > 50000:
            ratio = 50000 / face_count
            mod = obj.modifiers.new(name="Decimate", type='DECIMATE')
            mod.ratio = ratio
            bpy.ops.object.modifier_apply(modifier="Decimate")

        os.makedirs(export_dir, exist_ok=True)

        bpy.ops.export_scene.gltf(
            filepath=export_path,
            export_format='GLB',
            use_selection=False,
            export_apply=True,
            export_image_format='JPEG',
            export_draco_mesh_compression_enable=True,
            export_draco_mesh_compression_level=6,
            export_materials='EXPORT',
        )

        file_size_mb = os.path.getsize(export_path) / (1024 * 1024)
        self.report({'INFO'}, f"Exportado: {export_path} ({file_size_mb:.1f} MB)")
        props.output = f"Medalha '{medal_id}' exportada! ({file_size_mb:.1f} MB)"

        return {'FINISHED'}


class AIAssistantProperties(bpy.types.PropertyGroup):
    api_key: StringProperty(
        name="API Key",
        description="Sua Anthropic API key",
        subtype='PASSWORD',
        default="",
    )
    command: StringProperty(
        name="Comando",
        description="Digite seu comando em português",
        default="",
    )
    medal_id: StringProperty(
        name="Medal ID",
        description="ID da medalha para exportação (ex: obfep)",
        default="",
    )
    model: EnumProperty(
        name="Modelo",
        items=[
            ('claude-sonnet-5', 'Sonnet 5 ($3/M)', 'Rápido e barato — ideal para comandos simples'),
            ('claude-haiku-4-5', 'Haiku 4.5 ($1/M)', 'Mais barato — bom para coisas triviais'),
            ('claude-opus-5', 'Opus 5 ($5/M)', 'Mais inteligente — para tarefas complexas'),
        ],
        default='claude-sonnet-5',
    )
    output: StringProperty(
        name="Output",
        default="",
    )
    last_code: StringProperty(
        name="Last Code",
        default="",
    )
    last_error: StringProperty(
        name="Last Error",
        default="",
    )
    auto_fix: BoolProperty(
        name="Auto-corrigir erros",
        description="Se o código der erro, envia o erro de volta pro Claude corrigir automaticamente",
        default=True,
    )


class AI_PT_MainPanel(bpy.types.Panel):
    bl_label = "AI Assistant"
    bl_idname = "AI_PT_MainPanel"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = "AI Assistant"

    def draw(self, context):
        layout = self.layout
        props = context.scene.ai_assistant

        anthropic = get_anthropic_module()
        if anthropic is None:
            box = layout.box()
            box.label(text="⚠ anthropic não instalado", icon='ERROR')
            box.operator("ai_assistant.install_deps", icon='IMPORT')
            return

        layout.prop(props, "api_key")
        layout.separator()

        layout.prop(props, "model")
        layout.prop(props, "auto_fix")
        layout.separator()

        box = layout.box()
        box.label(text="Comando livre:", icon='CONSOLE')
        box.prop(props, "command", text="")
        box.operator("ai_assistant.execute", icon='PLAY')

        layout.separator()

        box = layout.box()
        box.label(text="Exportar medalha (atalho):", icon='EXPORT')
        box.prop(props, "medal_id", text="ID")
        box.operator("ai_assistant.export_medal", icon='MESH_UVSPHERE')

        if props.output:
            layout.separator()
            box = layout.box()
            box.label(text="Resultado:", icon='INFO')
            for line in props.output.split("\n"):
                box.label(text=line)


classes = (
    AIAssistantProperties,
    AI_OT_InstallDeps,
    AI_OT_Execute,
    AI_OT_ExportMedal,
    AI_PT_MainPanel,
)


def register():
    for cls in classes:
        bpy.utils.register_class(cls)
    bpy.types.Scene.ai_assistant = bpy.props.PointerProperty(type=AIAssistantProperties)


def unregister():
    del bpy.types.Scene.ai_assistant
    for cls in reversed(classes):
        bpy.utils.unregister_class(cls)


if __name__ == "__main__":
    register()
