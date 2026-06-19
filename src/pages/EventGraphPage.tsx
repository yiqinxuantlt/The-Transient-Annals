import { ReactFlowProvider } from 'reactflow'
import GraphWorkbench from '../components/GraphWorkbench'
import { useProject } from '../hooks/useProject'
import { useFushengluStore } from '../store/useFushengluStore'
import { getProjectTemplate } from '../templates/projectTemplates'

function EventGraphInner() {
  const project = useProject()
  const template = getProjectTemplate(project.templateId, project.category)
  const addEventLink = useFushengluStore((state) => state.addEventLink)
  const updateEventLinkStyle = useFushengluStore((state) => state.updateEventLinkStyle)
  const deleteEventLink = useFushengluStore((state) => state.deleteEventLink)
  const updateNodePosition = useFushengluStore((state) => state.updateEventNodePosition)
  const batchUpdatePositions = useFushengluStore((state) => state.batchUpdateEventNodePositions)
  const addAnalysisNote = useFushengluStore((state) => state.addAnalysisNote)
  const deleteAnalysisNote = useFushengluStore((state) => state.deleteAnalysisNote)

  return (
    <GraphWorkbench
      project={project}
      graphMode="events"
      eyebrow={template.pages.eventGraph.eyebrow}
      title={template.pages.eventGraph.title}
      description={template.pages.eventGraph.description}
      connectionTitle={template.pages.eventGraph.composerTitle}
      connectionSubmitLabel="添加连接"
      connectionTypes={template.eventLinkTypes}
      onAddEventLink={(draft) => addEventLink(project.id, draft)}
      onUpdateEdgeStyle={(edgeId, style) => updateEventLinkStyle(project.id, edgeId, style)}
      onDeleteEdge={(edgeId) => deleteEventLink(project.id, edgeId)}
      onNodePositionChange={(nodeId, position) => updateNodePosition(project.id, nodeId, position)}
      onBatchLayout={(positions) => batchUpdatePositions(project.id, positions)}
      onAddAnalysisNote={addAnalysisNote}
      onDeleteAnalysisNote={deleteAnalysisNote}
    />
  )
}

export default function EventGraphPage() {
  return (
    <ReactFlowProvider>
      <EventGraphInner />
    </ReactFlowProvider>
  )
}
