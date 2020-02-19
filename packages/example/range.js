let range = 104
let max = 5
function compute(average, number = range) {
  const values = []
  for(let i = 0; i<number; i++) {
    values.push(parseInt(Math.random() * max))
  }

  const deviate = number * average - values.reduce((r, c) => r + c, 0)
  complete(values, deviate)
  return values
}

function complete(values, inputDeviate) {
  if (inputDeviate === 0) return

  let deviate = inputDeviate
  const negative = deviate < 0
  values.some((value, i) => {
    if (negative) {
      // 直接消化掉
      if (value > Math.abs(deviate)) {
        values[i] = value + deviate
        deviate = 0
        return true
      }
      // 消化 50%
      const reduce = Math.ceil(value/2)
      values[i] = value - reduce
      deviate = deviate + reduce
    } else {
      const toComplete = max -value
      if (deviate < toComplete) {
        values[i] = value + deviate
        deviate = 0
        return true
      }
      // 消化 50%
      const toIncrease = Math.ceil(toComplete/2)
      values[i] = value + toIncrease
      deviate = deviate - toIncrease
    }
  })

  complete(values, deviate)
}


let data = [77, 63, 43, 42, 32, 41, 53, 31, 32, 82, 22, 68, 75, 86, 72, 32, 41, 53, 32, 82, 22, 38, 75, 86, 63, 52, 32, 41, 53, 11, 32, 82, 22, 68, 75, 22]
data.forEach(d => {
  console.log(compute(d/20).join(","))
})