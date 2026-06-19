import { ReactFlowProvider } from 'reactflow'
import GraphWorkbench from '../components/GraphWorkbench'
import { useProject } from '../hooks/useProject'
import { useFushengluStore } from '../store/useFushengluStore'
import { getProjectTemplate } from '../templates/projectTemplates'

function RelationGraphInner() {
  const project = useProject()
  const template = getProjectTemplate(project.templateId, project.category)
  const addRelation = useFushengluStore((state) => state.addEntityRelation)
  const updateRelationStyle = useFushengluStore((state) => state.updateEntityRelationStyle)
  const deleteRelation = useFushengluStore((state) => state.deleteEntityRelation)
  const updateNodePosition = useFushengluStore((state) => state.updateEntityNodePosition)
  const batchUpdatePositions = useFushengluStore((state) => state.batchUpdateEntityNodePositions)
  const addAnalysisNote = useFushengluStore((state) => state.addAnalysisNote)
  const deleteAnalysisNote = useFushengluStore((state) => state.deleteAnalysisNote)

  return (
    <GraphWorkbench
      project={project}
      graphMode="entities"
      eyebrow={template.pages.relationGraph.eyebrow}
      title={template.pages.relationGraph.title}
      description={template.pages.relationGraph.description}
      connectionTitle={template.pages.relationGraph.composerTitle}
      connectionSubmitLabel="添加关系"
      connectionTypes={template.relationTypes}
      onAddEntityRelation={(draft) => addRelation(project.id, draft)}
      onUpdateEdgeStyle={(edgeId, style) => updateRelationStyle(project.id, edgeId, style)}
      onDeleteEdge={(edgeId) => deleteRelation(project.id, edgeId)}
      onNodePositionChange={(nodeId, position) => updateNodePosition(project.id, nodeId, position)}
      onBatchLayout={(positions) => batchUpdatePositions(project.id, positions)}
      onAddAnalysisNote={addAnalysisNote}
      onDeleteAnalysisNote={deleteAnalysisNote}
    />
  )
}

export default function RelationGraphPage() {
  return (
    <ReactFlowProvider>
      <RelationGraphInner />
    </ReactFlowProvider>
  )
}
