export const IS_NON_DIMENSIONAL = /acit|ex(?:s|g|n|p|$)|rph|ows|mnc|ntw|ine[ch]|zoo|^ord/i

function withCamelCase(last, current) {
	return last.concat(current,
		/-/.test(current) ?
			current.replace(/(.+)-([a-z])(.+)/, (match, first, letter, rest) => {
				return `${first}${letter.toUpperCase()}${rest}`
			}) :
			[]
	)
}

export const IS_ATTR_NUMBER = new RegExp([
	'flex',
	'flex-grow',
	'flex-shrink',
	'line-height',
	'z-index'
	].reduce(withCamelCase, []).join('|'), 'i')

export const PATCH_ACTION_REMAIN = 'patch.remain'
export const PATCH_ACTION_REMOVE = 'patch.remove'
export const PATCH_ACTION_INSERT = 'patch.insert'
export const PATCH_ACTION_TO_MOVE = 'patch.toMove'
export const PATCH_ACTION_MOVE_FROM = 'patch.moveFrom'
export const DEV_MAX_LOOP = 1000

export const PROD = 'prod'
export const DEBUG = 'debug'

export const SESSION_INITIAL = 'session.initial'
export const SESSION_UPDATE = 'session.update'
export const UNIT_PAINT = 'unit.paint'
export const UNIT_REPAINT = 'unit.repaint'
export const UNIT_INITIAL_DIGEST = 'unit.initialDigest'
export const UNIT_UPDATE_DIGEST = 'unit.updateDigest'
export const UNIT_PARTIAL_UPDATE_DIGEST = 'unit.partialUpdateDigest'
