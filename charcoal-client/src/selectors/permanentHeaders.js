export const getPermanentHeaders = ({ permanentHeaders }) => (permanentHeaders)

export const getRoomIdsInNeighborhood = (NeighborhoodId) => ({ permanentHeaders = {} }) => {
    const baseAncestry = (NeighborhoodId && permanentHeaders[NeighborhoodId] && permanentHeaders[NeighborhoodId].Ancestry) || ''
    return Object.values(permanentHeaders)
        .filter(({ Type }) => (Type === 'ROOM'))
        .filter(({ Ancestry }) => (Ancestry.startsWith(baseAncestry)))
        .map(({ PermanentId }) => PermanentId)
}

export const getNeighborhoodsByAncestry = (Ancestry) => ({ permanentHeaders = {}}) => {
    const ancestryList = Ancestry ? Ancestry.split(':').slice(0, -1) : []
    return ancestryList.map((neighborhoodId) => (permanentHeaders && permanentHeaders[neighborhoodId]))
        .filter((neighborhood) => (neighborhood))
}

const mergeSubtree = (state, { ancestryList, node }) => {
    if (ancestryList.length) {
        const pullOut = (state && state[ancestryList[0]] && state[ancestryList[0]].children) || {}
        return {
            ...state,
            [ancestryList[0]]: {
                ...(state[ancestryList[0]] || {}),
                children: mergeSubtree(pullOut, {
                    ancestryList: ancestryList.slice(1),
                    node
                })
            }
        }
    }
    else {
        return {
            ...state,
            [node.PermanentId]: {
                ...(state[node.PermanentId] || {}),
                ...node
            }
        }
    }
}

//
// As items get reparented, room can be in an old locaton while its neighborhood has moved
// to a new location (or vice versa), in ways that leave a duplicate merged neighborhood that
// will get no data.  This function removes those branches from the tree, so that they don't
// cause a key collision at render time.
//
const elideInTransitBranches = (nodeTree) => {
    const retVal = {
        ...(Object.values(nodeTree)
            .filter((node) => (node.PermanentId))
            .map(({ children, ...rest }) => {
                const elidedChildren = (children && elideInTransitBranches(children)) || null
                return {
                    ...rest,
                    ...((elidedChildren && Object.values(elidedChildren).length) ? { children: elidedChildren } : {})
                }
            })
            .reduce((previous, node) => ({ ...previous, [node.PermanentId]: node }), {})
        )
    }
    return retVal
}

export const treeify = (nodeList) => (
    elideInTransitBranches(nodeList.reduce((previous, node) => {
        const ancestryList = (node.Ancestry && node.Ancestry.split(':').slice(0, -1)) || []
        return mergeSubtree(previous, { ancestryList, node })
    }, {}))
)

export const getNeighborhoodOnlyTree = ({ permanentHeaders }) => (
    treeify(Object.values(permanentHeaders).filter(({ Type }) => (Type === 'NEIGHBORHOOD')))
)

export const getNeighborhoodOnlyTreeExcludingSubTree = (ancestryToExclude) => ({ permanentHeaders }) => (
    treeify(Object.values(permanentHeaders)
            .filter(({ Type }) => (Type === 'NEIGHBORHOOD'))
            .filter(({ Ancestry }) => (!Ancestry.startsWith(ancestryToExclude)))
        )
)

export const getNeighborhoodTree = ({ permanentHeaders }) => (treeify(Object.values(permanentHeaders)))

export const getNeighborhoodSubtree = ({ roomId, ancestry }) => ({ permanentHeaders }) => {
    const parentAncestry = ((ancestry && ancestry.split(':').slice(0, -1)) || []).join(':')
    return treeify(Object.values(permanentHeaders)
        .filter(({ Ancestry }) => (!parentAncestry || (Ancestry || '').startsWith(parentAncestry)))
        .filter(({ PermanentId }) => (PermanentId !== roomId)))
}

export const getExternalTree = ({ roomId, ancestry }) => ({ permanentHeaders }) => {
    const parentAncestry = ((ancestry && ancestry.split(':').slice(0, -1)) || []).join(':')
    return treeify(Object.values(permanentHeaders)
        .filter(({ Ancestry }) => (parentAncestry && !((Ancestry || '').startsWith(parentAncestry)))))
}