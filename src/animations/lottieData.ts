/**
 * Lightweight vector-only Lottie animation definitions.
 * Designed specifically for high-performance 60fps micro-moments.
 *
 * Color palette aligns with futuristic dark theme & cyan accent (#68D9D0).
 * Total bundle weight: < 5KB combined.
 */

export const successCheckLottie = {
  v: '5.7.4',
  fr: 30,
  ip: 0,
  op: 30,
  w: 100,
  h: 100,
  nm: 'SuccessCheck',
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'CheckLayer',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [50, 50, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [85, 85, 100] },
            { t: 15, s: [105, 105, 100] },
            { t: 24, s: [100, 100, 100] }
          ]
        }
      },
      ao: 0,
      shapes: [
        {
          ty: 'gr',
          nm: 'Checkmark Group',
          it: [
            {
              ind: 0,
              ty: 'sh',
              ks: {
                a: 0,
                k: {
                  i: [[0, 0], [0, 0], [0, 0]],
                  o: [[0, 0], [0, 0], [0, 0]],
                  v: [[-18, 1], [-5, 14], [19, -12]],
                  c: false
                }
              },
              nm: 'Path'
            },
            {
              ty: 'tm',
              s: { a: 0, k: 0 },
              e: {
                a: 1,
                k: [
                  { i: { x: [0.2], y: [1] }, o: { x: [0.4], y: [0] }, t: 6, s: [0] },
                  { t: 22, s: [100] }
                ]
              },
              o: { a: 0, k: 0 },
              m: 1,
              nm: 'Trim'
            },
            {
              ty: 'st',
              c: { a: 0, k: [0.408, 0.851, 0.816, 1] }, // #68D9D0
              o: { a: 0, k: 100 },
              w: { a: 0, k: 6.5 },
              lc: 2,
              lj: 2,
              nm: 'Stroke'
            },
            {
              ty: 'tr',
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
              sk: { a: 0, k: 0 },
              sa: { a: 0, k: 0 },
              nm: 'Tr'
            }
          ]
        },
        {
          ty: 'gr',
          nm: 'Circle Group',
          it: [
            {
              ty: 'el',
              d: 1,
              p: { a: 0, k: [0, 0] },
              s: { a: 0, k: [74, 74] },
              nm: 'Circle'
            },
            {
              ty: 'tm',
              s: { a: 0, k: 0 },
              e: {
                a: 1,
                k: [
                  { i: { x: [0.2], y: [1] }, o: { x: [0.4], y: [0] }, t: 0, s: [0] },
                  { t: 18, s: [100] }
                ]
              },
              o: { a: 0, k: -90 },
              m: 1,
              nm: 'Trim'
            },
            {
              ty: 'st',
              c: { a: 0, k: [0.408, 0.851, 0.816, 1] }, // #68D9D0
              o: { a: 0, k: 100 },
              w: { a: 0, k: 4.5 },
              lc: 2,
              lj: 2,
              nm: 'Stroke'
            },
            {
              ty: 'tr',
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
              sk: { a: 0, k: 0 },
              sa: { a: 0, k: 0 },
              nm: 'Tr'
            }
          ]
        }
      ],
      ip: 0,
      op: 30,
      st: 0,
      bm: 0
    }
  ]
};

export const connectionRadarLottie = {
  v: '5.7.4',
  fr: 30,
  ip: 0,
  op: 45,
  w: 100,
  h: 100,
  nm: 'ConnectionRadar',
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'CenterDot',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [50, 50, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [90, 90, 100] },
            { t: 22, s: [115, 115, 100] },
            { t: 45, s: [90, 90, 100] }
          ]
        }
      },
      ao: 0,
      shapes: [
        {
          ty: 'gr',
          nm: 'Dot',
          it: [
            { ty: 'el', d: 1, p: { a: 0, k: [0, 0] }, s: { a: 0, k: [16, 16] }, nm: 'Circle' },
            { ty: 'fl', c: { a: 0, k: [0.408, 0.851, 0.816, 1] }, o: { a: 0, k: 100 }, nm: 'Fill' },
            {
              ty: 'tr',
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
              sk: { a: 0, k: 0 },
              sa: { a: 0, k: 0 },
              nm: 'Tr'
            }
          ]
        }
      ],
      ip: 0,
      op: 45,
      st: 0,
      bm: 0
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: 'Pulse1',
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 0, s: [90] },
            { t: 36, s: [0] }
          ]
        },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [50, 50, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [25, 25, 100] },
            { t: 36, s: [100, 100, 100] }
          ]
        }
      },
      ao: 0,
      shapes: [
        {
          ty: 'gr',
          nm: 'Ring',
          it: [
            { ty: 'el', d: 1, p: { a: 0, k: [0, 0] }, s: { a: 0, k: [76, 76] }, nm: 'Circle' },
            {
              ty: 'st',
              c: { a: 0, k: [0.408, 0.851, 0.816, 1] },
              o: { a: 0, k: 100 },
              w: { a: 0, k: 3 },
              lc: 2,
              lj: 2,
              nm: 'Stroke'
            },
            {
              ty: 'tr',
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
              sk: { a: 0, k: 0 },
              sa: { a: 0, k: 0 },
              nm: 'Tr'
            }
          ]
        }
      ],
      ip: 0,
      op: 45,
      st: 0,
      bm: 0
    },
    {
      ddd: 0,
      ind: 3,
      ty: 4,
      nm: 'Pulse2',
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 16, s: [90] },
            { t: 45, s: [0] }
          ]
        },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [50, 50, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 16, s: [25, 25, 100] },
            { t: 45, s: [100, 100, 100] }
          ]
        }
      },
      ao: 0,
      shapes: [
        {
          ty: 'gr',
          nm: 'Ring',
          it: [
            { ty: 'el', d: 1, p: { a: 0, k: [0, 0] }, s: { a: 0, k: [76, 76] }, nm: 'Circle' },
            {
              ty: 'st',
              c: { a: 0, k: [0.408, 0.851, 0.816, 1] },
              o: { a: 0, k: 100 },
              w: { a: 0, k: 3 },
              lc: 2,
              lj: 2,
              nm: 'Stroke'
            },
            {
              ty: 'tr',
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
              sk: { a: 0, k: 0 },
              sa: { a: 0, k: 0 },
              nm: 'Tr'
            }
          ]
        }
      ],
      ip: 0,
      op: 45,
      st: 0,
      bm: 0
    }
  ]
};

export const futuristicLoaderLottie = {
  v: '5.7.4',
  fr: 30,
  ip: 0,
  op: 30,
  w: 100,
  h: 100,
  nm: 'FuturisticLoader',
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'SpinnerArc',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: {
          a: 1,
          k: [
            { t: 0, s: [0] },
            { t: 30, s: [360] }
          ]
        },
        p: { a: 0, k: [50, 50, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] }
      },
      ao: 0,
      shapes: [
        {
          ty: 'gr',
          nm: 'Arc',
          it: [
            { ty: 'el', d: 1, p: { a: 0, k: [0, 0] }, s: { a: 0, k: [74, 74] }, nm: 'Circle' },
            { ty: 'tm', s: { a: 0, k: 0 }, e: { a: 0, k: 70 }, o: { a: 0, k: 0 }, m: 1, nm: 'Trim' },
            {
              ty: 'st',
              c: { a: 0, k: [0.408, 0.851, 0.816, 1] },
              o: { a: 0, k: 100 },
              w: { a: 0, k: 6 },
              lc: 2,
              lj: 2,
              nm: 'Stroke'
            },
            {
              ty: 'tr',
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
              sk: { a: 0, k: 0 },
              sa: { a: 0, k: 0 },
              nm: 'Tr'
            }
          ]
        }
      ],
      ip: 0,
      op: 30,
      st: 0,
      bm: 0
    }
  ]
};
