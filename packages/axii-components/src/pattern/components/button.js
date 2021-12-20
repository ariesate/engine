import { INDEX } from '../case.js';
import { spaceValues, lineHeightValues } from '../basic.js';
import { matrixMatch } from 'axii';

export function createButtonToken ({ size }, offset) {
  const horizontalMatrix = [
    [undefined, 15],
    [INDEX.size.small, 0],
    [INDEX.size.large, 15],
  ]
  const verticalMatrix = [
    [undefined, spaceValues(-1 + offset)],
    [INDEX.size.small, 0],
    [INDEX.size.large, 6.4],
  ]
  return {
    horizontalPadding: matrixMatch([size], horizontalMatrix),
    verticalPadding: matrixMatch([size], verticalMatrix),
    lineHeight: lineHeightValues()
  }
}