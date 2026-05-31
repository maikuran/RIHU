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
const ETERNITY_THRESHOLD = new ExpantaNum('1.79e308').times(new ExpantaNum('1.79e308'))

// 数値の省略表記（K, M, B, T, Qa, Qi, Sx, Sp, Oc, No, Dc, Ud, Dd, Td, Qad, Qid, Sxd, Spd, Ocd, Nod, V...）
const SUFFIXES = [
    '', 'K', 'M', 'B', 'T',                                          // 0-4: 10^0～10^3
    'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc', 'Ud', 'Dd', 'Td',     // 5-14: 10^15～10^42
    'Qad', 'Qid', 'Sxd', 'Spd', 'Ocd', 'Nod', 'V', 'UVi', 'DVi', 'TVi', // 15-24
    'QaVi', 'QiVi', 'SxVi', 'SpVi', 'OcVi', 'NoVi', 'TrVi', 'UViVi', 'DViVi', 'TViVi', // 25-34
    'QaVg', 'QiVg', 'SxVg', 'SpVg', 'OcVg', 'NoVg', 'TrVg', 'UVg', 'DVg', 'TVg', // 35-44
    'QaVg', 'QiVg', 'SxVg', 'SpVg', 'OcVg', 'NoVg', 'TrVg', 'QaOg', 'QiOg', 'SxOg', // 45-54
    'SpOg', 'OcOg', 'NoOg', 'TrOg', 'UVg', 'DVg', 'TVg', 'QaVg', 'QiVg', 'SxVg', // 55-64
];

// 1.79e308用の接尾辞（1e3ごと）- 308/3=102以上が必要
const INFINITY_SUFFIXES = [
    '', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', // 0-10
    'Dc', 'Ud', 'Dd', 'Td', 'Qad', 'Qid', 'Sxd', 'Spd', 'Ocd', 'Nod', // 11-20
    'V', 'UVi', 'DVi', 'TVi', 'QaVi', 'QiVi', 'SxVi', 'SpVi', 'OcVi', 'NoVi', // 21-30
    'TrVi', 'UViVi', 'DViVi', 'TViVi', 'QaVg', 'QiVg', 'SxVg', 'SpVg', 'OcVg', 'NoVg', // 31-40
    'TrVg', 'UVg', 'DVg', 'TVg', 'QaVg', 'QiVg', 'SxVg', 'SpVg', 'OcVg', 'NoVg', // 41-50
    'TrVg', 'QaOg', 'QiOg', 'SxOg', 'SpOg', 'OcOg', 'NoOg', 'TrOg', 'UOg', 'DOg', // 51-60
    'TOg', 'QaUg', 'QiUg', 'SxUg', 'SpUg', 'OcUg', 'NoUg', 'TrUg', 'UUg', 'DUg', // 61-70
    'TUg', 'QaDg', 'QiDg', 'SxDg', 'SpDg', 'OcDg', 'NoDg', 'TrDg', 'UDg', 'DDg', // 71-80
    'TDg', 'QaTg', 'QiTg', 'SxTg', 'SpTg', 'OcTg', 'NoTg', 'TrTg', 'UTg', 'DTg', // 81-90
    'TTg', 'QaQag', 'QiQag', 'SxQag', 'SpQag', 'OcQag', 'NoQag', 'TrQag', 'UQag', 'DQag', // 91-100
    'TQag', 'QaQig', 'QiQig', 'SxQig', 'SpQig', // 101-105
];

var arcColors = Array.from({length: RINGS}, (_, i) => `hsl(${360 / RINGS * i}, 100%, 60%)`)
var arcColorsSec = Array.from({length: RINGS}, (_, i) => `hsl(${360 / RINGS * i}, 100%, 10%)`)
var arcColorsTer = Array.from({length: RINGS}, (_, i) => `hsl(${360 / RINGS * i}, 100%, 40%)`)
var arcColorsTet = Array.from({length: RINGS}, (_, i) => `hsla(${360 / RINGS * i}, 100%, 60%, 0.3)`)

var mainCanvas = null
var mainCanvasDiv = null

function initCanvas() {
    mainCanvasDiv = document.getElementById("mainCanvasDiv")
    mainCanvas = document.getElementById("mainCanvas")
    
    if (mainCanvasDiv && mainCanvas) {
        mainCanvas.width = mainCanvasDiv.clientWidth
        mainCanvas.height = mainCanvasDiv.clientHeight
    }
}

function loadData() {
    for (let i = 0; i < RINGS; i++) {
        document.getElementById("lapUpgrades").innerHTML += `<button class="lapBtn" id="lapBtn${i + 1}" onclick="upgradeCircle(${i})" style="color: ${arcColors[i]}; border-color: ${arcColors[i]}; background-color: ${arcColorsSec[i]}; display: none;">
            <span id="lap${i + 1}Level" style="font-weight: bold;">Lv.0</span> | 環${i + 1}
            <br><small>現在: <span id="lapBtn${i + 1}Current">0</span> /秒</small>
            <br><small>次: <span id="lapBtn${i + 1}Next">0</span> /秒</small>
            <br><small>コスト: <span id="lapBtn${i + 1}Cost">0</span></small>
        </button>`
    }

    let lapBtns = document.getElementsByClassName("lapBtn")
    
    for (let i = 0; i < lapBtns.length; i++) {
        lapBtns[i].addEventListener("mouseenter", (e) => {
            e.target.style.backgroundColor = arcColorsTer[i]
        })

        lapBtns[i].addEventListener("mouseleave", (e) => {
            e.target.style.backgroundColor = arcColorsSec[i]
        })
    }

    if (player.hyp == 1) {
        let initRingPrices = Array.from({length: RINGS}, (_, x) => (x == 0) ? 10 : 100 * Math.pow(10, x))
        let initRingSpeeds = Array.from({length: RINGS}, (_, x) => Math.max(0.5 - 0.03 * x, 0.05))
        let initRingEffects = Array.from({length: RINGS}, (_, x) => Math.pow(10, x * 2))
        let initPriceScalings = Array.from({length: RINGS}, (_, x) => 1.5 + x * 0.08)
        let initLevelBases = Array.from({length: RINGS}, (_, x) => Math.max(0.1 - 0.005 * x, 0.01))

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

/**
 * 1.79e308以上の数値をフォーマット
 * 例: 500000 * 1.79e308 -> "500KInf"
 */
function formatInfinity(multiplier) {
    multiplier = Number(multiplier)
    
    if (multiplier < 1) {
        return multiplier.toFixed(2) + 'Inf'
    }
    
    if (multiplier >= 1000) {
        let exponent = Math.floor(Math.log10(multiplier))
        let suffixIndex = Math.floor(exponent / 3)
        
        if (suffixIndex >= INFINITY_SUFFIXES.length) {
            suffixIndex = INFINITY_SUFFIXES.length - 1
        }
        
        let mantissa = multiplier / Math.pow(10, suffixIndex * 3)
        let suffix = INFINITY_SUFFIXES[suffixIndex]
        
        if (mantissa >= 100) {
            return Math.floor(mantissa) + suffix + 'Inf'
        } else if (mantissa >= 10) {
            return mantissa.toFixed(1) + suffix + 'Inf'
        } else {
            return mantissa.toFixed(2) + suffix + 'Inf'
        }
    } else if (multiplier >= 10) {
        return multiplier.toFixed(1) + 'Inf'
    } else {
        return multiplier.toFixed(2) + 'Inf'
    }
}

// 科学記法を使用した表示
function formatScientific(num) {
    if (num instanceof ExpantaNum) {
        if (num.gte(ETERNITY_THRESHOLD)) {
            return 'Eternity!'
        }
        if (num.gte(INFINITY_THRESHOLD)) {
            let mantissa = num.toNumber() / INFINITY_THRESHOLD
            return formatInfinity(mantissa)
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
        return 'Infinity!'
    }

    // Eternity判定
    if (num >= INFINITY_THRESHOLD) {
        let mantissa = num / INFINITY_THRESHOLD
        return formatInfinity(mantissa)
    }

    // 1000以上は科学記法
    if (num >= 1000) {
        let exponent = Math.floor(Math.log10(num))
        let mantissa = num / Math.pow(10, exponent)
        
        if (mantissa >= 9.95) {
            exponent++
            mantissa = 1
        }
        
        return mantissa.toFixed(2) + '×10<sup>' + exponent + '</sup>'
    } else if (num >= 10) {
        return num.toFixed(1)
    } else {
        return num.toFixed(2)
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
        // Infinity表記
        if (num.gte(INFINITY_THRESHOLD)) {
            let mantissa = num.toNumber() / INFINITY_THRESHOLD
            return formatInfinity(mantissa)
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

    // Infinity表記
    if (num >= INFINITY_THRESHOLD) {
        let mantissa = num / INFINITY_THRESHOLD
        return formatInfinity(mantissa)
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
        let mantissa = num / INFINITY_THRESHOLD
        return formatInfinity(mantissa)
    } else if (num >= 1000) {
        return Math.floor(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    } else {
        return num.toFixed(sig)
    }
}

function formatEN(num) {
    return formatScientific(num)
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
    let pointsNum = player.points instanceof ExpantaNum ? player.points.toNumber() : Number(player.points)
    let prestigeGain = Math.floor(Math.sqrt(pointsNum) * 0.1)
    
    if (prestigeGain > 0) {
        player.prestige += prestigeGain
        player.prestigeBonus = Math.pow(1.05, player.prestige)
        
        // リセット
        player.points = 0
        for (let i = 0; i < RINGS; i++) {
            player[`r${i + 1}`].level = 0
            player[`r${i + 1}`].laps = 0
            player[`r${i + 1}`].lapsCeil = 1
            player[`r${i + 1}`].unlocked = (i == 0) ? true : false
            player[`r${i + 1}`].unlockedUpgrade = (i == 0) ? true : false
        }
        alert(`ぷれすてぃじ獲得: +${prestigeGain}\n合計: ${player.prestige}\nボーナス: ×${player.prestigeBonus.toFixed(2)}`)
    } else {
        alert('ぷれすてぃじできるほどのぽいんとがありません')
    }
}

// Infinity: 1.79e308に到達時
function checkInfinity() {
    let pointsNum = player.points instanceof ExpantaNum ? player.points.toNumber() : Number(player.points)
    if (pointsNum >= INFINITY_THRESHOLD) {
        triggerInfinity()
    }
}

function triggerInfinity() {
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
    alert(`いんふぃにてぃ到達！ #${player.infinity}`)
}

// Eternity: 1.79e308 Infに到達時
function checkEternity() {
    let pointsNum = player.points instanceof ExpantaNum ? player.points.toNumber() : Number(player.points)
    
    if (pointsNum >= INFINITY_THRESHOLD) {
        let multiplier = pointsNum / INFINITY_THRESHOLD
        if (multiplier >= 1.79e308) {
            triggerEternity()
        }
    }
}

function triggerEternity() {
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
    alert(`いたにてぃ到達！ #${player.eternity}`)
}

// 手動トリガー（ボタン用）
function manualInfinity() {
    triggerInfinity()
}

function manualEternity() {
    triggerEternity()
}

function upgradeCircle(n) {
    let price = player[`r${n + 1}`].price
    let pointsNum = player.points instanceof ExpantaNum ? player.points.toNumber() : Number(player.points)
    
    if (pointsNum >= price) {
        if (player.points instanceof ExpantaNum) {
            player.points = player.points.minus(price)
        } else {
            player.points -= price
        }
        player[`r${n + 1}`].level += 1
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
            formulaText += `<span style="font-family: ${formulaLetterFont}; font-size: ${formulaLetterSize}; color: ${arcColors[i]}">${formatScientific(player["r" + (i + 1)].effectBase)}${formulaLetters[i]}</span>`
            if (i < formulaLetters.length - 1) {
                formulaText += ` + `
            }
        }
    }

    return formulaText
}

function drawRings() {
    if (!mainCanvas) return
    
    let c = mainCanvas.getContext('2d')
    c.clearRect(0, 0, mainCanvas.width, mainCanvas.height)
    
    const centerX = mainCanvas.width / 2
    const centerY = mainCanvas.height / 2
    const baseRadius = 60
    const ringSpacing = 50
    
    for (let i = 0; i < RINGS; i++) {
        let ringData = player[`r${i + 1}`]
        
        if (ringData.unlocked) {
            const radius = baseRadius + ringSpacing * i
            const progress = (ringData.laps) % 1
            
            // 背景の環
            c.beginPath()
            c.arc(centerX, centerY, radius, 0, 2 * Math.PI, false)
            c.strokeStyle = arcColorsSec[i]
            c.lineWidth = 12
            c.stroke()
            
            // 進捗バー
            c.beginPath()
            c.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + progress * 2 * Math.PI, false)
            c.strokeStyle = arcColors[i]
            c.lineWidth = 12
            c.stroke()
            
            // グロー効果
            c.beginPath()
            c.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + progress * 2 * Math.PI, false)
            c.strokeStyle = arcColorsTet[i]
            c.lineWidth = 20
            c.stroke()
        }
    }
}

function update() {
    drawRings()
    
    document.getElementById("formula").innerHTML = updateFormula()
    
    for (let i = 0; i < RINGS; i++) {
        let ringData = player[`r${i + 1}`]
        if (player.hyp == 1) {
            player[`r${i + 1}`].effect = (player[`r${i + 1}`].lapsCeil - 1) * player[`r${i + 1}`].effectBase
        }

        if (ringData.unlockedUpgrade) {
            if (document.getElementById("lapBtn" + (i + 1)).style.display != "revert") {
                document.getElementById("lapBtn" + (i + 1)).style.display = "revert";
            }

            document.getElementById("lapBtn" + (i + 1) + "Current").innerHTML = formatScientific(ringData.speed)
            document.getElementById("lapBtn" + (i + 1) + "Next").innerHTML = formatScientific(ringData.speed + ringData.levelBase)
            document.getElementById("lapBtn" + (i + 1) + "Cost").innerHTML = formatScientific(ringData.price)
            document.getElementById("lap" + (i + 1) + "Level").innerHTML = "Lv." + ringData.level
        }

        if (ringData.level >= 5) {
            if (i + 1 < RINGS && player[`r${i + 2}`].unlockedUpgrade != true) {
                player[`r${i + 2}`].unlockedUpgrade = true
            }
        }

        if (ringData.level >= 1) {
            if (player[`r${i + 1}`].unlocked != true) {
                player[`r${i + 1}`].unlocked = true
            }
        }
    }

    document.getElementById("points").innerHTML = formatScientific(player.points)
    document.getElementById("pointGen").innerHTML = formatScientific(pointGen())
}

function mainLoop() {
    for (let i = 0; i < RINGS; i++) {
        let ringData = player[`r${i + 1}`]

        if (ringData.unlocked) {
            ringData.speed = ringData.speedInit + ringData.level * ringData.levelBase
            ringData.price = ringData.priceInit * Math.pow(ringData.priceScale, ringData.level)
            
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

// 初期化
window.addEventListener('load', function() {
    initCanvas()
    loadData()
    update()
})

// リサイズ対応
window.addEventListener('resize', function() {
    initCanvas()
})

// メインループ開始
window.setInterval(function() {
    mainLoop()
    update()
}, 1000/FPS)
