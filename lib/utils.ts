export function calculateLuhn(controlString) {
    let sum = 0;
    let shouldDouble = false;

    for (let i = controlString.length - 1; i >= 0; i--) {
        let digit = parseInt(controlString[i], 10);

        if (shouldDouble) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }

        sum += digit;
        shouldDouble = !shouldDouble;
    }

    return (10 - (sum % 10)) % 10;
}

export function cleanData(data) {
    return data.replace(/\x00+$/, "").replace(/[^\x20-\x7E]/g, "");
}