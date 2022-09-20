import { LocalStorageFunctions } from "./storageFunctions/localStorageFunctions.js";

const userContractLocal = new LocalStorageFunctions("@imob");
const userSheetLocal = new LocalStorageFunctions("@sheet");
const userInput    = document.querySelectorAll('input');
let userContract   = loadUserData();
let bills = userContract ? calcBills(userSheetLocal.load() ?? []) : [];

for (const item of userInput) {
    item.addEventListener('change', validateUserInputs)
}

function calculateMonthlyRates() {
    nominalMonthly.innerHTML  = (nominalYearly.value / 12).toFixed(4);
    cetMonthly.innerHTML      = (cetYearly.value / 12).toFixed(4);
    efectiveMonthly.innerHTML = (efectiveYearly.value / 12).toFixed(4);
}

function loadUserData() {
    const userContract = userContractLocal.load();

    if (userContract) {
        userInput[0].value  = userContract.propertyValue;
        userInput[1].value  = userContract.nominalYearly;
        userInput[2].value  = userContract.avaliation;
        userInput[3].value  = userContract.financedValue;
        userInput[4].value  = userContract.cetYearly;
        userInput[5].value  = userContract.itbi;
        userInput[6].value  = userContract.term;
        userInput[7].value  = userContract.efectiveYearly;
        userInput[8].value  = userContract.initialDate;
        userInput[9].value  = userContract.registry;
        userInput[10].value = userContract.mip;
        userInput[11].value = userContract.dfi;
        userInput[12].value = userContract.tsa;
    
        calculateMonthlyRates();
    }
    return userContract;
}

function getUserInputs(userInput) {
    return {
        propertyValue: userInput[0].value,
        nominalYearly: userInput[1].value,
        avaliation: userInput[2].value,
        financedValue: userInput[4].value,
        cetYearly: userInput[5].value,
        itbi: userInput[6].value,
        term: userInput[7].value,
        efectiveYearly: userInput[8].value,
        initialDate: userInput[9].value,
        registry: userInput[10].value,
        mip: userInput[11].value,
        dfi: userInput[12].value,
        tsa: userInput[13].value
    }
}

function validateUserInputs() {
    let itens = 0;

    for (const item of userInput) {
        const { value } = item;

        itens = value ? itens + 1 : itens;

        if (userInput.length == itens) {
            userContractLocal.add(getUserInputs(userInput));
            userContract = loadUserData();
        }
    }
    calculateMonthlyRates();
}

function createTableRows(){
	const table	= expected;
    const rows  = userContract ? userContract.term : 0;
    table.innerHTML = "";

	for (let i = 0; i < rows; i++) {
		const row =	table.insertRow(i);

        for (let cols = 0; cols < 19; cols++) {
            row.insertCell(cols);
        }
	}
}

function billingValues(balanceDue, i, terms) {
    const term       = terms - i;
    const quota      = balanceDue / term
    const mip        = userContract.mip * balanceDue;
    const dfi        = Number(userContract.dfi);
    const tsa        = Number(userContract.tsa);
    const rateValue  = balanceDue * ((nominalYearly.value / 12) / 100);
    const total      = (quota + rateValue + mip + dfi + tsa)
    const newBalance = balanceDue - quota;

    return { quota, mip, dfi, tsa, rateValue, total, newBalance }
}

function calcBills (bills = []) {
    let balanceDue = userContract.financedValue;
    let terms = userContract.term;

    for (let i = 0; i < terms; i++) {
        const date = new Date(userContract.initialDate);
        date.setHours(date.getHours() + 3);
        date.setMonth(date.getMonth() + i + 1);
        
        const rowData = billingValues(balanceDue, i, terms);
        const tr      = bills[i] ? Number(bills[i].tr) : 1;
        const trValue = bills[i] ? ((tr - 1) * balanceDue) : 0;
        
        const extraPayments = bills[i] ? Number(bills[i].extraPayments) : 0;
        const method        = bills[i] ? bills[i].method : "";

        balanceDue    = rowData.newBalance + trValue - extraPayments;

        const reduction = bills[i] ? 
            method  == "term" ? 
                Math.floor((terms - i - 1) - (balanceDue / (rowData.total - (balanceDue * ((nominalYearly.value / 12) / 100)))))
                :  
                0
            :
            0;

        if (reduction > 0) {
            terms = terms - reduction;
        }

        const bill  = {
            term: i + 1,
            date,
            total: rowData.total,
            quota: rowData.quota,
            rateValue: rowData.rateValue,
            mip: rowData.mip,
            dfi: rowData.dfi,
            tsa: rowData.tsa,
            balance: balanceDue,
            tr,
            trValue,
            extraPayments,
            method,
            reduction,

            extraFee1: 0,
            extraFee2: 0,

            paymentDate: null,
            payedValue: 0
        }

        if (bills[i]) {
            bills[i] = bill;
        }
        else {
            bills = [...bills, bill];
        }
    }

    userSheetLocal.add(bills);
    return bills;
};

function fillData() {
    if (userContract) {    
        let row = 0;
        while (bills[row].balance >= 0) {
            expected.rows[row].cells[0].innerHTML  = bills[row].term;
            expected.rows[row].cells[1].innerHTML  = bills[row].date.toLocaleDateString(); 
            expected.rows[row].cells[2].innerHTML  = bills[row].total.toFixed(2);
            expected.rows[row].cells[3].innerHTML  = bills[row].quota.toFixed(2);
            expected.rows[row].cells[6].innerHTML  = bills[row].reduction;
            expected.rows[row].cells[7].innerHTML  = bills[row].rateValue.toFixed(2);
            expected.rows[row].cells[9].innerHTML  = bills[row].trValue.toFixed(2);
            expected.rows[row].cells[10].innerHTML = bills[row].mip.toFixed(2);
            expected.rows[row].cells[11].innerHTML = bills[row].dfi.toFixed(2);
            expected.rows[row].cells[12].innerHTML = bills[row].tsa.toFixed(2);
            expected.rows[row].cells[15].innerHTML = bills[row].balance.toFixed(2);
            expected.rows[row].cells[16].innerHTML = bills[row].paymentDate ? "Pago" : "Em Aberto"            
            
            if (bills[row].balance == 0) {
                break;
            }
            row++;
        }
    }
}

function setInputs() { 
    console.log(bills);
    for (let row = 0; row < expected.rows.length; row++) {
        expected.rows[row].cells[8].innerHTML  = `<input type='number' name="tr" min="0" value=${bills[row].tr.toFixed(8)} id="${row}"> </input>`;
        expected.rows[row].cells[5].innerHTML  = `<input  type='number' name="extraPayments" min="0" value=${bills[row].extraPayments.toFixed(2)} id="${row}"> </input>`;
        expected.rows[row].cells[4].innerHTML  = `<select id='method-${row}' name="methods"> <option value='cut' ${bills[row].method == "cut" ? 'selected' : ''}> Redução </option> <option value="term" ${bills[row].method == "term" ? 'selected' : ''}> Prazo </option> </select>`;

        // todo (extra) ->
        expected.rows[row].cells[13].innerHTML = `<input  name="extraFee1" type='number' min="0" value=${bills[row].extraFee1.toFixed(2)} id="${row}"> </input>`;
        expected.rows[row].cells[14].innerHTML = `<input  name="extraFee2" type='number' min="0" value=${bills[row].extraFee2.toFixed(2)} id="${row}"> </input>`;
        expected.rows[row].cells[17].innerHTML = bills[row].paymentDate ? bills[row].paymentDate.toLocaleDateString() : `<input  name="paymentDate" type='date' id="${row}"> </input>`;
        expected.rows[row].cells[18].innerHTML = `<input  name="payedValue" type='number' min="0" value=${bills[row].payedValue.toFixed(2)} id="${row}"> </input>`;
    }

    const trs = document.querySelectorAll('[name="tr"]');
    const extraPayments = document.querySelectorAll('[name="extraPayments"]');
    // const methods       = document.querySelectorAll('[name="methods"]');
    
    for (const item of trs) {
        item.addEventListener('change', (e) => {
            const {id, value} = e.target;
            bills[id].tr      = value;
        
            bills = calcBills(bills);
            fillData();
        });
    }
    
    for (const item of extraPayments) {
        item.addEventListener('change', (e) => {
            const {id, value} = e.target;
            const method      = document.getElementById("method-"+id).value;
            bills[id].extraPayments = value;
            bills[id].method        = method;
    
            bills = calcBills(bills);
            fillData();
        });
    }
}

function updateTable(){
    createTableRows();
    bills = calcBills();
    fillData();
    setInputs();
}

createTableRows();
fillData();
setInputs();

update.addEventListener('click', updateTable)
