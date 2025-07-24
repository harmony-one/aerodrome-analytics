const fs = require('fs');
const readline = require('readline');

export function calculateImpermanentLoss({
    depositedToken0,
    depositedToken1,
    withdrawnToken0,
    withdrawnToken1,
    currentPrice,      // Текущая рыночная цена токена1 в токене0 (например, cBBTC в USDC)
    tickLowerPrice,    // Нижняя граница диапазона (в токен0 за токен1)
    tickUpperPrice     // Верхняя граница диапазона
}) {
    const sqrt = Math.sqrt;

    const sqrtP_low = sqrt(tickLowerPrice);
    const sqrtP_high = sqrt(tickUpperPrice);
    const sqrtP_cur = sqrt(currentPrice);

    const valueHODL = depositedToken0 + depositedToken1 * currentPrice;
    let valueLP = 0;

    // Если позиция уже закрыта (есть withdrawn токены) — считаем напрямую
    if ((withdrawnToken0 ?? 0) > 0 || (withdrawnToken1 ?? 0) > 0) {
        valueLP = withdrawnToken0 + withdrawnToken1 * currentPrice;
    } else {
        // Позиция ещё активна — считаем теоретическую стоимость LP-позиции
        let L;

        if (depositedToken0 > 0 && depositedToken1 === 0) {
            // Ликвидность вся в токене0 (USDC)
            L = depositedToken0 / (sqrtP_high - sqrtP_low);
            valueLP = L * (sqrtP_cur - sqrtP_low);
        } else if (depositedToken1 > 0 && depositedToken0 === 0) {
            // Ликвидность вся в токене1 (cBBTC)
            L = depositedToken1 * sqrtP_low * sqrtP_high / (sqrtP_high - sqrtP_low);
            valueLP = L * (sqrtP_high - sqrtP_cur) / (sqrtP_cur * sqrtP_high) * currentPrice;
        } else {
            // Смесь токенов — приближение: считаем как HODL, IL ≈ 0
            valueLP = valueHODL;
        }
    }

    const IL_absolute = valueLP - valueHODL;
    const IL_relative = (IL_absolute / valueHODL) * 100;

    return {
        absoluteIL: IL_absolute.toFixed(6),
        relativeIL: Math.abs(IL_relative).toFixed(2) + "%",
        valueHODL: valueHODL.toFixed(6),
        valueLP: valueLP.toFixed(6)
    };
}

const initialBlock = 30152681;
const initialTimestamp = 1747094709;

// Функция для перевода номера блока в timestamp
export function blockToTimestamp(blockNumber, initialBlock = 30152681, initialTimestamp = 1747094709, averageBlockTime = 2) {
    // Вычисляем разницу в блоках
    let blockDiff = blockNumber - initialBlock;

    // Переводим разницу в timestamp
    let timestamp = initialTimestamp + blockDiff * averageBlockTime;

    return timestamp;
}

// Функция для перевода timestamp в номер блока
export function timestampToBlock(timestamp, initialBlock, initialTimestamp, averageBlockTime = 2) {
    // Вычисляем разницу во времени
    let timestampDiff = timestamp - initialTimestamp;

    // Переводим разницу во времени в количество блоков
    let blockDiff = timestampDiff / averageBlockTime;

    // Вычисляем номер блока
    let blockNumber = initialBlock + blockDiff;

    return Math.floor(blockNumber); // Возвращаем целое число
}

export const getFile = (filePath: string) => {
    return new Promise((resolve, reject) => {
        const rl = readline.createInterface({
            input: fs.createReadStream(filePath),
            output: process.stdout,
            terminal: false
        });

        const allData: any[] = [];

        rl.on('line', (line: string) => {
            try {
                const jsonData = JSON.parse(line);
                allData.push(jsonData);
            } catch (err) {
                console.error('Ошибка при парсинге строки:', err);
                reject(err);
            }
        });

        rl.on('close', () => {
            resolve(allData);
        });
    });
}

export const rewardTokens = {
    '0x29219dd400f2Bf60E5a23d13Be72B486D4038894': { address: '0x29219dd400f2Bf60E5a23d13Be72B486D4038894', decimals: 6, price: 1 },
    '0x6047828dc181963ba44974801FF68e538dA5eaF9': { address: '0x6047828dc181963ba44974801FF68e538dA5eaF9', decimals: 6, price: 1 },
    '0x3333b97138D4b086720b5aE8A7844b1345a33333': { address: '0x3333b97138D4b086720b5aE8A7844b1345a33333', decimals: 18, price: 79.11 },
    '0x5555b2733602DEd58D47b8D3D989E631CBee5555': { address: '0x5555b2733602DEd58D47b8D3D989E631CBee5555', decimals: 18, price: 105.029979 },
    '0x5050bc082FF4A74Fb6B0B04385dEfdDB114b2424': { address: '0x5050bc082FF4A74Fb6B0B04385dEfdDB114b2424', decimals: 18, price: 17 },
    '0xE5DA20F15420aD15DE0fa650600aFc998bbE3955': { address: '0xE5DA20F15420aD15DE0fa650600aFc998bbE3955', decimals: 18, price: 0.5391 },
    '0xd3DCe716f3eF535C5Ff8d041c1A41C3bd89b97aE': { address: '0xd3DCe716f3eF535C5Ff8d041c1A41C3bd89b97aE', decimals: 6, price: 0.9983 },
    '0x039e2fb66102314ce7b64ce5ce3e5183bc94ad38': { address: '0x039e2fb66102314ce7b64ce5ce3e5183bc94ad38', decimals: 18, price: 0.4919 },
    '0x940181a94A35A4569E4529A3CDfB74e38FD98631': { address: '0x940181a94A35A4569E4529A3CDfB74e38FD98631', decimals: 18, price: 0.8424 },
}

export const timestampToStartOfHour = (timestamp: number) => {
    return Math.floor(timestamp / 3600) * 3600;
}