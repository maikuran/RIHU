var player = {
    hyp: 1,
    prestige: 0,
    prestigeBonus: 1,
    infinity: 0,
    eternity: 0,
}

const RINGS = 14
const FPS = 20

// Infinity/Eternity限界値
const INFINITY_THRESHOLD = 1.79e308
const ETERNITY_THRESHOLD = new ExpantaNum('1.79e308')

// 数値の省略表記（K, M, B, T, Qa, Qi, Sx, Sp, Oc, No, Dc, Ud, Dd, Td, Qad, Qid, Sxd, Spd, Ocd, Nod, V...）
const SUFFIXES = [
    '', 'K', 'M', 'B', 'T',                                          // 0-4: 10^0～10^15
    'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc', 'Ud', 'Dd', 'Td',     // 5-14: 10^18～10^45
    'Qad', 'Qid', 'Sxd', 'Spd', 'Ocd', 'Nod', 'V', 'UVi', 'DVi', 'TVi', // 15-24
    'QaVi', 'QiVi', 'SxVi', 'SpVi', 'OcVi', 'NoVi', 'TrVi', 'UViVi', 'DViVi', 'TViVi', // 25-34
    'QaVg', 'QiVg', 'SxVg', 'SpVg', 'OcVg', 'NoVg', 'TrVg', 'UVg', 'DVg', 'TVg', // 35-44
    'QaVg', 'QiVg', 'SxVg', 'SpVg', 'OcVg', 'NoVg', 'TrVg', 'QaOg', 'QiOg', 'SxOg', // 45-54
    'SpOg', 'OcOg', 'NoOg', 'TrOg', 'UVg', 'DVg', 'TVg', 'QaVg', 'QiVg', 'SxVg', // 55-64
    'Inf'  // 65+: Infinity以上
];

var arcColors = Array.from({length: RINGS}, (_, i) => `hsl(${360 / RINGS * i}, 100%, 60%)`)
var arcColorsSec = Array.from({length: RINGS}, (_, i) => `hsl(${360 / RINGS * i}, 100%, 10%)`)
var arcColorsTer = Array.from({length: RINGS}, (_, i) => `hsl(${360 / RINGS * i}, 100%, 40%)`)
var arcColorsTet = Array.from({length: RINGS}, (_, i) => `hsla(${360 / RINGS * i}, 100%, 60%, 0.1)`)

var mainCanvas = document.getElementById("mainCanvas")
mainCanvas.width = document.getElementById("mainCanvasDiv").style.width.replace('px', '')
mainCanvas.height = document.getElementById("mainCanvasDiv").style.height.replace('px', '')

function loadData() {
    for (let i = 0; i < RINGS; i++) {
        document.getElementById("lapUpgrades").innerHTML += `<button class="lapBtn" id="lapBtn${i + 1}" onclick="upgradeCircle(${i})" style="color: ${arcColors[i]}; border-color: ${arcColors[i]}; background-color: ${arcColorsSec[i]}; padding: 10px; margin: 5px; border-radius: 5px; border-width: 2px; cursor: pointer;"><b>Ring ${i + 1}</b><br><span id="lapBtn${i + 1}Current">0</span> → <span id="lapBtn${i + 1}Next">0</span><br>Cost: <span id="lapBtn${i + 1}Cost">0</span><br>Level: <span id="lap${i + 1}Level">0</span></button>`
    }

    let lapBtns = document.getElementsByClassName("lapBtn")
    
    for (let i = 0; i < lapBtns.length; i++) {
        lapBtns[i].addEventListener("mouseenter", (e) => {
            e.target.style.color = arcColorsSec[i]
            e.target.style.backgroundColor = arcColorsTer[i]
        })

        lapBtns[i].addEventListener("mouseleave", (e) => {
            e.target.style.color = arcColors[i]
            e.target.style.backgroundColor = arcColorsSec[i]
        })
    }

    if (player.hyp == 1) {
        let initRingPrices = Array.from({length: RINGS}, (_, x) => (x == 0) ? 10 : 50 * Math.pow(20, x))
        let initRingSpeeds = Array.from({length: RINGS}, (_, x) => Math.max(1 - 0.02 * x, 0.1))
        let initRingEffects = Array.from({length: RINGS}, (_, x) => Math.pow(10, x))
        let initPriceScalings = Array.from({length: RINGS}, (_, x) => 1.25 + x * 0.05)
        let initLevelBases = Array.from({length: RINGS}, (_, x) => Math.max(0.05 - 0.01 * x, 0.01))

        Object.assign(player, {points: 0})

        for (let i = 0; i < RINGS; i++) {
            Object.assign(player, 
                {["r" + (i+1)]: {
                    price: initRingPrices[i],
                    priceInit: initRingPrices[i],
                    priceScale: initPriceScalings[i],
                    level: 0,
                    levelBase: initLevelBases[i],
                    speed: initRingSpeeds[i],
                    speedInit: initRingSpeeds[i],
                    laps: 0,
                    lapsCeil: 1,
                    progress: 0,
                    effectBase: initRingEffects[i],
                    effect: 0,
                    unlocked: (i == 0) ? true : false,
                    unlockedUpgrade: (i == 0) ? true : false,
                }}
            )
        }
    }
}

loadData()

function upgradeCircle(n) {
    if (player.points >= player[`r${n + 1}`].price) {
        player.points -= player[`r${n + 1}`].price
        player[`r${n + 1}`].level += 1
    }
}

// 数値をフォーマット（K, M, B, ... QaOg, Inf形式）
function formatWithSuffix(num) {
    // ExpantaNumの場合
    if (num instanceof ExpantaNum) {
        // Infinityチェック
        if (num.gte(ETERNITY_THRESHOLD)) {
            return 'Infinity^Infinity'
        }
        // Eternity表記（1.79e308Inf）
        if (num.gte(INFINITY_THRESHOLD)) {
            let mantissa = num.toNumber() / INFINITY_THRESHOLD
            return mantissa.toFixed(2) + 'e308Inf'
        }
        num = num.toNumber()
    }

    num = Number(num)

    // 1未満
    if (num < 1) {
        return num.toFixed(2)
    }

    // Infinity判定
    if (!isFinite(num)) {
        return 'Infinity'
    }

    // Eternity表記（1.79e308Inf）
    if (num >= INFINITY_THRESHOLD) {
        let mantissa = num / INFINITY_THRESHOLD
        return mantissa.toFixed(2) + 'e308Inf'
    }

    // ログで桁数を計算
    let exponent = Math.floor(Math.log10(Math.abs(num)))
    let suffixIndex = Math.floor(exponent / 3)
    
    if (suffixIndex >= SUFFIXES.length) {
        return num.toExponential(2).replace('+', '')
    }
    
    let mantissa = num / Math.pow(10, suffixIndex * 3)
    let suffix = SUFFIXES[suffixIndex]
    
    if (mantissa >= 100) {
        return Math.floor(mantissa) + suffix
    } else if (mantissa >= 10) {
        return mantissa.toFixed(1) + suffix
    } else {
        return mantissa.toFixed(2) + suffix
    }
}

function formatNormal(num, sig = 0) {
    if (num instanceof ExpantaNum || typeof num === 'object') {
        return formatWithSuffix(num)
    }

    num = Number(num)

    if (num >= INFINITY_THRESHOLD) {
        return formatWithSuffix(num)
    } else if (num >= 1000) {
        return Math.floor(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    } else {
        return num.toFixed(sig)
    }
}

function formatEN(num) {
    return formatWithSuffix(num)
}

function pointGen() {
    let effectSum = 0
    let lapsSum = 0

    for (let i = 0; i < RINGS; i++) {
        let ringData = player[`r${i + 1}`]

        if (ringData.unlocked) {
            effectSum += ringData.effect
            lapsSum += ringData.speed
        }
    }

    let baseGen = new ExpantaNum(effectSum * lapsSum)
    return baseGen.times(player.prestigeBonus)
}

function revComplete(mult) {
    if (player.hyp == 1) {
        var effectSum = 0

        for (let i = 0; i < RINGS; i++) {
            let ringData = player[`r${i + 1}`]

            if (ringData.unlocked) {
                effectSum += ringData.effect
            }
        }

        let bonus = new ExpantaNum(effectSum * mult).times(player.prestigeBonus)
        player.points = new ExpantaNum(player.points).plus(bonus)
    }
}

// Prestige（プレステージ）: 全リングをリセットしてボーナスを得る
function doPrestige() {
    // ボーナス計算（獲得したポイントの平方根 × 0.1）
    let prestigeGain = Math.floor(Math.sqrt(player.points) * 0.1)
    
    if (prestigeGain > 0) {
        player.prestige += prestigeGain
        player.prestigeBonus = Math.pow(1.05, player.prestige) // 1プレステージあたり5%ボーナス
        
        // リセット
        player.points = 0
        for (let i = 0; i < RINGS; i++) {
            player[`r${i + 1}`].level = 0
            player[`r${i + 1}`].laps = 0
            player[`r${i + 1}`].lapsCeil = 1
            player[`r${i + 1}`].unlocked = (i == 0) ? true : false
            player[`r${i + 1}`].unlockedUpgrade = (i == 0) ? true : false
        }
        alert(`Prestige獲得: +${prestigeGain}\n合計プレステージ: ${player.prestige}\nボーナス倍率: ${player.prestigeBonus.toFixed(2)}x`)
    } else {
        alert('プレステージできるほどのポイントがありません')
    }
}

// Infinity: 1.79e308に到達時
function checkInfinity() {
    if (player.points >= INFINITY_THRESHOLD) {
        player.infinity++
        player.points = 0
        player.prestige = 0
        player.prestigeBonus = 1
        
        // リセット
        for (let i = 0; i < RINGS; i++) {
            player[`r${i + 1}`].level = 0
            player[`r${i + 1}`].laps = 0
            player[`r${i + 1}`].lapsCeil = 1
            player[`r${i + 1}`].unlocked = (i == 0) ? true : false
            player[`r${i + 1}`].unlockedUpgrade = (i == 0) ? true : false
        }
        alert(`Infinity到達！ #${player.infinity}`)
    }
}

// Eternity: 1.79e308 Infに到達時
function checkEternity() {
    let currentValue = new ExpantaNum(player.points)
    let eternityThreshold = new ExpantaNum(INFINITY_THRESHOLD).times(1.79e308)
    
    if (currentValue.gte(eternityThreshold)) {
        player.eternity++
        player.points = 0
        player.prestige = 0
        player.infinity = 0
        player.prestigeBonus = 1
        
        // リセット
        for (let i = 0; i < RINGS; i++) {
            player[`r${i + 1}`].level = 0
            player[`r${i + 1}`].laps = 0
            player[`r${i + 1}`].lapsCeil = 1
            player[`r${i + 1}`].unlocked = (i == 0) ? true : false
            player[`r${i + 1}`].unlockedUpgrade = (i == 0) ? true : false
        }
        alert(`Eternity到達！ #${player.eternity}`)
    }
}

function updateFormula() {
    let formulaText = ''
    let formulaLetterFont = "CMU Serif"
    let formulaLetterSize = "20px"
    let formulaLetters = Array.from({length: RINGS}, (_, i) => 65 + i).map(n => String.fromCharCode(n))
    let effectSum = 0

    for (let i = 0; i < RINGS; i++) {
        effectSum += player["r" + (i + 1)].effect
    }

    if (player.hyp == 1) {
        for (let i = 0; i < formulaLetters.length; i++) {
            formulaText += `<span style="font-family: ${formulaLetterFont}; font-size: ${formulaLetterSize}; color: ${arcColors[i]}">${formatNormal(player["r" + (i + 1)].effectBase)}${formulaLetters[i]}</span>`
            if (i < formulaLetters.length - 1) {
                formulaText += ` + `
            }
        }
    }

    return formulaText
}

function update() {
    let c = mainCanvas.getContext('2d')
    c.clearRect(0, 0, mainCanvas.width, mainCanvas.height)
    
    document.getElementById("formula").innerHTML = updateFormula()
    
    for (let i = 0; i < RINGS; i++) {
        let ringData = player[`r${i + 1}`]
        if (player.hyp == 1) {
            player[`r${i + 1}`].effect = (player[`r${i + 1}`].lapsCeil - 1) * player[`r${i + 1}`].effectBase
        }

        if (ringData.unlocked) {
            c.beginPath()
            c.arc(mainCanvas.width / 2, mainCanvas.height / 2, 35+35*i, 0, (ringData.laps) % 1 * 2 * Math.PI, false)
            c.strokeStyle = arcColors[i]
            c.lineWidth = 25
            c.stroke()
            
            c.beginPath()
            c.arc(mainCanvas.width / 2, mainCanvas.height / 2, 35+35*i, 0, (ringData.laps) % 1 * 2 * Math.PI, false)
            c.strokeStyle = arcColorsTet[i]
            c.lineWidth = 35
            c.stroke()

            player[`r${i + 1}`].speed = ringData.speedInit + ringData.level * ringData.levelBase
            player[`r${i + 1}`].price = ringData.priceInit * Math.pow(ringData.priceScale, ringData.level)
        }

        if (ringData.level >= 5) {
            if (i + 1 < RINGS && player[`r${i + 2}`].unlockedUpgrade != true) {
                player[`r${i + 2}`].unlockedUpgrade = true
            }
        }

        if (ringData.level == 1) {
            if (player[`r${i + 1}`].unlocked != true) {
                player[`r${i + 1}`].unlocked = true
            }
        }

        if (ringData.unlockedUpgrade) {
            if (document.getElementById("lapBtn" + (i + 1)).style.display != "revert") {
                document.getElementById("lapBtn" + (i + 1)).style.display = "revert";
            }

            document.getElementById("lapBtn" + (i + 1) + "Current").innerHTML = formatNormal(ringData.speed, 2)
            document.getElementById("lapBtn" + (i + 1) + "Next").innerHTML = formatNormal(ringData.speed + ringData.levelBase, 2)
            document.getElementById("lapBtn" + (i + 1) + "Cost").innerHTML = formatNormal(ringData.price, 2)
            document.getElementById("lap" + (i + 1) + "Level").innerHTML = ringData.level
        }
    }

    document.getElementById("points").innerHTML = formatNormal(player.points)
    document.getElementById("pointGen").innerHTML = formatNormal(pointGen(), 2)
}

function mainLoop() {
    for (let i = 0; i < RINGS; i++) {
        let ringData = player[`r${i + 1}`]

        if (ringData.unlocked) {
            ringData.laps = ringData.laps + ringData.speed / FPS

            if (ringData.laps >= ringData.lapsCeil) {
                revComplete(ringData.laps - ringData.lapsCeil + 1)
            }

            ringData.lapsCeil = Math.ceil(ringData.laps)
        }
    }
    
    checkInfinity()
    checkEternity()
}

window.setInterval(function() {
    mainLoop()
    update()

}, 1000/FPS)