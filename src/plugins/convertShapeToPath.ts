export const type = 'perItem';

export const active = true;

export const description = 'converts basic shapes to more compact path form';

export const params = {
  convertArcs: false,
};

/**
 * Converts basic shape to more compact path.
 * It also allows further optimizations like
 * combining paths with similar attributes.
 *
 * @see http://www.w3.org/TR/SVG/shapes.html
 *
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Lev Solntsev
 */
export function fn(item, params) {
  const none = { value: 0 };
  const regNumber = /[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g;

  const convertArcs = params && params.convertArcs;

  if (
    item.isElem('rect') &&
    item.hasAttr('width') &&
    item.hasAttr('height') &&
    !item.hasAttr('rx') &&
    !item.hasAttr('ry')
  ) {
    const x = +(item.attr('x') || none).value;
    const y = +(item.attr('y') || none).value;
    const width = +item.attr('width').value;
    const height = +item.attr('height').value;

    // Values like '100%' compute to NaN, thus running after
    // cleanupNumericValues when 'px' units has already been removed.
    // TODO: Calculate sizes from % and non-px units if possible.
    if (isNaN(x - y + width - height)) {
      return;
    }

    // prettier-ignore
    const pathData =
        'M' + x +  ' ' + y + 'H' + (x + width) + 'V' + (y + height) + 'H' + x + 'Z';

    item.addAttr({
      name: 'd',
      value: pathData,
      prefix: '',
      local: 'd',
    });

    item.renameElem('path').removeAttr(['x', 'y', 'width', 'height']);
  } else if (item.isElem('line')) {
    const x1 = +(item.attr('x1') || none).value;
    const y1 = +(item.attr('y1') || none).value;
    const x2 = +(item.attr('x2') || none).value;
    const y2 = +(item.attr('y2') || none).value;
    if (isNaN(x1 - y1 + x2 - y2)) {
      return;
    }

    item.addAttr({
      name: 'd',
      value: 'M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2,
      prefix: '',
      local: 'd',
    });

    item.renameElem('path').removeAttr(['x1', 'y1', 'x2', 'y2']);
  } else if (
    (item.isElem('polyline') || item.isElem('polygon')) &&
    item.hasAttr('points')
  ) {
    const coords = (item.attr('points').value.match(regNumber) || []).map(
      Number,
    );
    if (coords.length < 4) {
      return false;
    }

    item.addAttr({
      name: 'd',
      value:
        'M' +
        coords.slice(0, 2).join(' ') +
        'L' +
        coords.slice(2).join(' ') +
        (item.isElem('polygon') ? 'z' : ''),
      prefix: '',
      local: 'd',
    });

    item.renameElem('path').removeAttr('points');
  } else if (item.isElem('circle') && convertArcs) {
    const cx = +(item.attr('cx') || none).value;
    const cy = +(item.attr('cy') || none).value;
    const r = +(item.attr('r') || none).value;
    if (isNaN(cx - cy + r)) {
      return;
    }
    // prettier-ignore
    const cPathData =
      'M' + cx + ' ' + (cy - r) +
      'A' + r + ' ' + r + ' 0 1 0 ' + cx + ' ' + (cy + r) +
      'A' + r + ' ' + r + ' 0 1 0 ' + cx + ' ' + (cy - r) +
      'Z';
    item.addAttr({
      name: 'd',
      value: cPathData,
      prefix: '',
      local: 'd',
    });
    item.renameElem('path').removeAttr(['cx', 'cy', 'r']);
  } else if (item.isElem('ellipse') && convertArcs) {
    const ecx = +(item.attr('cx') || none).value;
    const ecy = +(item.attr('cy') || none).value;
    const rx = +(item.attr('rx') || none).value;
    const ry = +(item.attr('ry') || none).value;
    if (isNaN(ecx - ecy + rx - ry)) {
      return;
    }
    // prettier-ignore
    const ePathData =
      'M' + ecx + ' ' + (ecy - ry) +
      'A' + rx + ' ' + ry + ' 0 1 0 ' + ecx + ' ' + (ecy + ry) +
      'A' + rx + ' ' + ry + ' 0 1 0 ' + ecx + ' ' + (ecy - ry) +
      'Z';
    item.addAttr({
      name: 'd',
      value: ePathData,
      prefix: '',
      local: 'd',
    });
    item.renameElem('path').removeAttr(['cx', 'cy', 'rx', 'ry']);
  }
}