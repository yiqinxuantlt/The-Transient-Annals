import cors from 'cors'
import express, { type NextFunction, type Request, type Response } from 'express'
import { z } from 'zod'
import { createSampleProject } from '../../src/data/sampleData.ts'
import type { EdgeVisualStyle, GraphNodePosition } from '../../src/types/index.ts'
import { normalizeProject, SCHEMA_VERSION } from './schema.ts'
import { getDatabasePath, readDatabase, saveDatabase } from './storage.ts'

const app = express()
const port = Number(process.env.FUSHENGLU_API_PORT || 4177)

app.use(cors({ origin: true }))
app.use(express.json({ limit: '8mb' }))

type AsyncHandler = (request: Request, response: Response, next: NextFunction) => Promise<void>

const asyncRoute =
  (handler: AsyncHandler) => (request: Request, response: Response, next: NextFunction) => {
    void handler(request, response, next).catch(next)
  }

const styleSchema = z.object({
  lineStyle: z.enum(['solid', 'dashed', 'dotted']).optional(),
  tone: z.enum(['cinnabar', 'jade', 'goldline', 'ink']).optional(),
  animated: z.boolean().optional(),
})

const positionSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
})

const routeParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] || '' : value || ''

async function updateProject(
  projectId: string,
  updater: (project: ReturnType<typeof normalizeProject>) => ReturnType<typeof normalizeProject>,
) {
  const database = await readDatabase()
  const index = database.projects.findIndex((project) => project.id === projectId)

  if (index < 0) return null

  const nextProject = normalizeProject({
    ...updater(database.projects[index]),
    updatedAt: new Date().toISOString(),
  })
  database.projects[index] = nextProject
  await saveDatabase(database)
  return nextProject
}

app.get('/api/health', (_request, response) => {
  response.json({
    ok: true,
    name: 'fushenglu-api',
    schemaVersion: SCHEMA_VERSION,
    storage: getDatabasePath(),
  })
})

app.get(
  '/api/projects',
  asyncRoute(async (_request, response) => {
    const database = await readDatabase()
    response.json({ projects: database.projects })
  }),
)

app.get(
  '/api/projects/:projectId',
  asyncRoute(async (request, response) => {
    const database = await readDatabase()
    const projectId = routeParam(request.params.projectId)
    const project = database.projects.find((item) => item.id === projectId)

    if (!project) {
      response.status(404).json({ error: 'Project not found' })
      return
    }

    response.json({ project })
  }),
)

app.post(
  '/api/projects',
  asyncRoute(async (request, response) => {
    const database = await readDatabase()
    const project = normalizeProject({
      ...request.body,
      updatedAt: new Date().toISOString(),
    })

    if (database.projects.some((item) => item.id === project.id)) {
      response.status(409).json({ error: 'Project already exists' })
      return
    }

    database.projects.unshift(project)
    await saveDatabase(database)
    response.status(201).json({ project })
  }),
)

app.put(
  '/api/projects/:projectId',
  asyncRoute(async (request, response) => {
    const database = await readDatabase()
    const projectId = routeParam(request.params.projectId)
    const project = normalizeProject({
      ...request.body,
      id: projectId,
    })
    const index = database.projects.findIndex((item) => item.id === project.id)

    if (index >= 0) {
      database.projects[index] = project
    } else {
      database.projects.unshift(project)
    }

    await saveDatabase(database)
    response.json({ project })
  }),
)

app.delete(
  '/api/projects/:projectId',
  asyncRoute(async (request, response) => {
    const database = await readDatabase()
    const projectId = routeParam(request.params.projectId)
    const nextProjects = database.projects.filter((project) => project.id !== projectId)

    if (nextProjects.length === database.projects.length) {
      response.status(404).json({ error: 'Project not found' })
      return
    }

    await saveDatabase({ ...database, projects: nextProjects })
    response.json({ ok: true })
  }),
)

app.post(
  '/api/projects/:projectId/restore-sample',
  asyncRoute(async (request, response) => {
    const projectId = routeParam(request.params.projectId)
    const nextProject = await updateProject(projectId, (project) =>
      normalizeProject(
        createSampleProject(
          project.id,
          project.title,
          project.category,
          project.subtitle,
          project.templateId,
        ),
      ),
    )

    if (!nextProject) {
      response.status(404).json({ error: 'Project not found' })
      return
    }

    response.json({ project: nextProject })
  }),
)

app.patch(
  '/api/projects/:projectId/node-positions/:kind/:nodeId',
  asyncRoute(async (request, response) => {
    const position = positionSchema.parse(request.body) as GraphNodePosition
    const projectId = routeParam(request.params.projectId)
    const nodeId = routeParam(request.params.nodeId)
    const kind = routeParam(request.params.kind)
    const nextProject = await updateProject(projectId, (project) => {
      if (kind === 'events') {
        return {
          ...project,
          eventNodePositions: {
            ...project.eventNodePositions,
            [nodeId]: position,
          },
        }
      }

      return {
        ...project,
        entityNodePositions: {
          ...project.entityNodePositions,
          [nodeId]: position,
        },
      }
    })

    if (!nextProject) {
      response.status(404).json({ error: 'Project not found' })
      return
    }

    response.json({ project: nextProject })
  }),
)

app.patch(
  '/api/projects/:projectId/relations/:relationId/style',
  asyncRoute(async (request, response) => {
    const style = styleSchema.parse(request.body) as EdgeVisualStyle
    const projectId = routeParam(request.params.projectId)
    const relationId = routeParam(request.params.relationId)
    const nextProject = await updateProject(projectId, (project) => ({
      ...project,
      entityRelations: project.entityRelations.map((relation) =>
        relation.id === relationId ? { ...relation, style } : relation,
      ),
    }))

    if (!nextProject) {
      response.status(404).json({ error: 'Project not found' })
      return
    }

    response.json({ project: nextProject })
  }),
)

app.patch(
  '/api/projects/:projectId/event-links/:linkId/style',
  asyncRoute(async (request, response) => {
    const style = styleSchema.parse(request.body) as EdgeVisualStyle
    const projectId = routeParam(request.params.projectId)
    const linkId = routeParam(request.params.linkId)
    const nextProject = await updateProject(projectId, (project) => ({
      ...project,
      eventLinks: project.eventLinks.map((link) =>
        link.id === linkId ? { ...link, style } : link,
      ),
    }))

    if (!nextProject) {
      response.status(404).json({ error: 'Project not found' })
      return
    }

    response.json({ project: nextProject })
  }),
)

app.use((error: unknown, _request: Request, response: Response, next: NextFunction) => {
  void next

  if (error instanceof z.ZodError) {
    response.status(400).json({ error: 'Invalid payload', issues: error.issues })
    return
  }

  response.status(500).json({ error: error instanceof Error ? error.message : 'Server error' })
})

app.listen(port, () => {
  console.log(`Fushenglu API ready at http://127.0.0.1:${port}`)
})
