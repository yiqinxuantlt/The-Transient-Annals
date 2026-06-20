import cors from 'cors'
import express, { type NextFunction, type Request, type Response } from 'express'
import { z } from 'zod'
import { createSampleProject } from '../../src/data/sampleData.ts'
import type { EdgeVisualStyle, GraphNodePosition } from '../../src/types/index.ts'
import { normalizeProject, SCHEMA_VERSION } from './schema.ts'
import { databaseStorage, getDatabasePath, readDatabase, updateDatabase } from './storage.ts'

type AsyncHandler = (request: Request, response: Response, next: NextFunction) => Promise<void>

const asyncRoute =
  (handler: AsyncHandler) => (request: Request, response: Response, next: NextFunction) => {
    void handler(request, response, next).catch(next)
  }

const styleSchema = z.object({
  lineStyle: z.enum(['solid', 'dashed', 'dotted', 'custom']).optional(),
  tone: z.enum(['cinnabar', 'jade', 'goldline', 'ink']).optional(),
  edgeType: z.enum(['straight', 'smoothstep', 'bezier', 'step']).optional(),
  lineWidth: z.number().min(0.5).max(12).optional(),
  animated: z.boolean().optional(),
  customColor: z
    .string()
    .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
    .optional(),
  opacity: z.number().min(0.1).max(1).optional(),
  dashLength: z.number().min(0).max(32).optional(),
  dashGap: z.number().min(0).max(32).optional(),
  arrow: z.enum(['none', 'target', 'source', 'both']).optional(),
  lineCap: z.enum(['round', 'butt', 'square']).optional(),
  labelVisible: z.boolean().optional(),
  shadow: z.boolean().optional(),
})

const positionSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
})

const routeParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] || '' : value || ''

const backupReasonHeader = (request: Request) =>
  routeParam(request.header('x-fushenglu-backup-reason')).trim() || undefined

async function updateProject(
  projectId: string,
  updater: (project: ReturnType<typeof normalizeProject>) => ReturnType<typeof normalizeProject>,
  backupReason?: string,
) {
  let nextProject: ReturnType<typeof normalizeProject> | null = null

  await updateDatabase(
    (database) => {
      const index = database.projects.findIndex((project) => project.id === projectId)

      if (index < 0) return database

      nextProject = normalizeProject({
        ...updater(database.projects[index]),
        updatedAt: new Date().toISOString(),
      })

      const projects = [...database.projects]
      projects[index] = nextProject
      return { ...database, projects }
    },
    { backupReason },
  )

  return nextProject
}

export function createFushengluApp() {
  const app = express()

  app.use(cors({ origin: true }))
  app.use(express.json({ limit: '8mb' }))

  app.get('/api/health', (_request, response) => {
    response.json({
      ok: true,
      name: 'fushenglu-api',
      schemaVersion: SCHEMA_VERSION,
      storageKind: databaseStorage.kind,
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
      const project = normalizeProject({
        ...request.body,
        updatedAt: new Date().toISOString(),
      })
      let alreadyExists = false

      await updateDatabase((database) => {
        if (database.projects.some((item) => item.id === project.id)) {
          alreadyExists = true
          return database
        }

        return { ...database, projects: [project, ...database.projects] }
      })

      if (alreadyExists) {
        response.status(409).json({ error: 'Project already exists' })
        return
      }

      response.status(201).json({ project })
    }),
  )

  app.put(
    '/api/projects/:projectId',
    asyncRoute(async (request, response) => {
      const projectId = routeParam(request.params.projectId)
      let project = normalizeProject({
        ...request.body,
        id: projectId,
      })

      await updateDatabase(
        (database) => {
          const projects = [...database.projects]
          const index = projects.findIndex((item) => item.id === project.id)
          project = normalizeProject({ ...project, updatedAt: new Date().toISOString() })

          if (index >= 0) {
            projects[index] = project
          } else {
            projects.unshift(project)
          }

          return { ...database, projects }
        },
        { backupReason: backupReasonHeader(request) },
      )

      response.json({ project })
    }),
  )

  app.delete(
    '/api/projects/:projectId',
    asyncRoute(async (request, response) => {
      const projectId = routeParam(request.params.projectId)
      let deleted = false

      await updateDatabase(
        (database) => {
          const nextProjects = database.projects.filter((project) => project.id !== projectId)
          deleted = nextProjects.length !== database.projects.length
          return deleted ? { ...database, projects: nextProjects } : database
        },
        { backupReason: backupReasonHeader(request) || 'delete-project' },
      )

      if (!deleted) {
        response.status(404).json({ error: 'Project not found' })
        return
      }

      response.json({ ok: true })
    }),
  )

  app.post(
    '/api/projects/:projectId/restore-sample',
    asyncRoute(async (request, response) => {
      const projectId = routeParam(request.params.projectId)
      const nextProject = await updateProject(
        projectId,
        (project) =>
          normalizeProject(
            createSampleProject(
              project.id,
              project.title,
              project.category,
              project.subtitle,
              project.templateId,
            ),
          ),
        backupReasonHeader(request) || 'restore-sample-data',
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

  return app
}
