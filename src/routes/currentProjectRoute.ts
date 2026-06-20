type RouteLocation = Pick<Location, 'hash' | 'pathname'>

function getRoutePath(location: RouteLocation) {
  if (location.hash.startsWith('#/')) {
    return location.hash.slice(1).split('?')[0].split('#')[0]
  }

  return location.pathname
}

export function getProjectIdFromLocation(location: RouteLocation) {
  const routePath = getRoutePath(location)
  const match = routePath.match(/^\/projects\/([^/?#]+)/)

  if (!match?.[1]) return undefined

  return decodeURIComponent(match[1])
}
