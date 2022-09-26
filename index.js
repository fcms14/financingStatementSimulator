import { LocalStorageFunctions } from "./storageFunctions/localStorageFunctions.js";

const userContractLocal = new LocalStorageFunctions("@imob");
const userSheetLocal    = new LocalStorageFunctions("@sheet");

let userContract = loadUserData();
let bills        = userContract ? calcBills(userSheetLocal.load() ?? []) : [];

function loadUserData() {
    const userContract = userContractLocal.load();

    if (userContract) {
        nominalYearly.value  = userContract.nominalYearly;
        mip.value = userContract.mip;
        dfi.value = userContract.dfi;
        tsa.value = userContract.tsa;
        propertyValue.value  = userContract.propertyValue;
        avaliation.value  = userContract.avaliation;
        financedValue.value  = userContract.financedValue;
        itbi.value  = userContract.itbi;
        initialDate.value  = userContract.initialDate;
        term.value  = userContract.term;
        registry.value  = userContract.registry;
    }

    return userContract;
}

function getUserInputs() {

    return {
        nominalYearly: nominalYearly.value,
        mip: mip.value,
        dfi: dfi.value,
        tsa: tsa.value,
        propertyValue: propertyValue.value,
        avaliation: avaliation.value,
        financedValue: financedValue.value,
        itbi: itbi.value,
        initialDate: initialDate.value,
        term: term.value,
        registry: registry.value,
    }
}

function createTableRows() {
	const table	= expected;
    const rows  = userContract ? userContract.term : 0;
    table.innerHTML = "";

	for (let i = 0; i < rows; i++) {
		const row =	table.insertRow(i);

        for (let cols = 0; cols < 17; cols++) {
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

function calcReduction(method, terms, i, balanceDue, total, quota){
    switch (method) {
        case "principal":
            return Math.floor((terms - i - 1) - (balanceDue / quota));
        case "total":
            return Math.floor((terms - i - 1) - (balanceDue / (total - ((balanceDue * ((nominalYearly.value / 12) / 100)) + Number(userContract.tsa) + Number(userContract.dfi) + (userContract.mip * balanceDue)))));
        case "term":
            return 0;
    }
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
        const paymentDate   = bills[i] ? bills[i].paymentDate ? bills[i].paymentDate : "" : "";
        const payedValue    = bills[i] ? bills[i].payedValue : 0;

        balanceDue    = rowData.newBalance + trValue - extraPayments;

        const reduction = bills[i] && extraPayments > 0 ? 
            calcReduction(method, terms, i, balanceDue, rowData.total, rowData.quota)
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
            paymentDate,
            payedValue
        };

        if (bills[i]) {
            bills[i] = bill;
        }
        else {
            bills = [...bills, bill];
        }
    }

    userSheetLocal.add(bills);
    
    return bills;
}

function fillData() {
    let totalDue = 0 , totalQuota = 0, totalAntecips = 0, totalReductions = 0, totalRate = 0, totalTrValue = 0, totalMip = 0, totalDfi = 0, totalTsa = 0, totalPayed = 0;
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
            expected.rows[row].cells[13].innerHTML = bills[row].balance.toFixed(2);
            expected.rows[row].cells[14].innerHTML = bills[row].paymentDate ? "Pago" : "Em Aberto";
            
            totalDue        += Number(bills[row].total);
            totalQuota      += Number(bills[row].quota);
            totalAntecips   += Number(bills[row].extraPayments);
            totalReductions += Number(bills[row].reduction);
            totalRate       += Number(bills[row].rateValue);
            totalTrValue    += Number(bills[row].trValue);
            totalMip        += Number(bills[row].mip);
            totalDfi        += Number(bills[row].dfi);
            totalTsa        += Number(bills[row].tsa);
            totalPayed      += Number(bills[row].payedValue);
            
            if (bills[row].balance == 0) {
                break;
            }
            row++;
        }
    }

    TDtotalDue.innerHTML = totalDue.toFixed(2); 
    TDtotalQuota.innerHTML = totalQuota.toFixed(2);
    TDtotalAntecips.innerHTML = totalAntecips.toFixed(2);
    TDtotalReductions.innerHTML = totalReductions.toFixed(0);
    TDtotalRate.innerHTML = totalRate.toFixed(2);
    TDtotalTrValue.innerHTML = totalTrValue.toFixed(2);
    TDtotalMip.innerHTML = totalMip.toFixed(2);
    TDtotalDfi.innerHTML = totalDfi.toFixed(2);
    TDtotalTsa.innerHTML = totalTsa.toFixed(2);
    TDtotalPayed.innerHTML = totalPayed.toFixed(2);
}

function setInputs() { 
    for (let row = 0; row < expected.rows.length; row++) {
        expected.rows[row].cells[8].innerHTML  = `<input type='number' name="tr" min="0" value=${bills[row].tr.toFixed(8)} id="${row}"> </input>`;
        expected.rows[row].cells[5].innerHTML  = `<input  type='number' name="extraPayments" min="0" value=${bills[row].extraPayments.toFixed(2)} id="${row}"> </input>`;
        expected.rows[row].cells[4].innerHTML  = `
            <select id='method-${row}' name="methods"> 
                <option value='term'      title="Reduz o valor total da Parcela"                      ${bills[row].method == "term"      ? 'selected' : ''}> Manter Prazo </option> 
                <option value='total'     title="Reduz o prazo mantendo o valor total da parcela"     ${bills[row].method == "total"     ? 'selected' : ''}> Manter Valor Total </option> 
                <option value='principal' title="Reduz o prazo mantendo o valor principal da parcela" ${bills[row].method == "principal" ? 'selected' : ''}> Manter Valor Principal  </option> 
            </select>`;
        expected.rows[row].cells[15].innerHTML = `<input  name="paymentDate" type='date' id="${row}" value="${bills[row].paymentDate ?? ''}"> </input>`;
        expected.rows[row].cells[16].innerHTML = `<input  name="payedValue" type='number' min="0" value=${Number(bills[row].payedValue).toFixed(2)} id="${row}"> </input>`;
    }

    const trs = document.querySelectorAll('[name="tr"]');
    const extraPayments = document.querySelectorAll('[name="extraPayments"]');
    const paymentDates  = document.querySelectorAll('[name="paymentDate"]');
    const payedValues   = document.querySelectorAll('[name="payedValue"]');
    const methods       = document.querySelectorAll('[name="methods"]');
    
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

    for (const item of methods) {
        item.addEventListener('change', (e) => {
            const method      = e.target.value;
            const id          = e.target.id.substring(7);
            bills[id].method  = method;    

            bills = calcBills(bills);
            fillData();
        });
    }


    for (const item of paymentDates) {
        item.addEventListener('change', (e) => {
            const {id, value} = e.target;
            bills[id].paymentDate = value;
    
            bills = calcBills(bills);
        });
    }

    for (const item of payedValues) {
        item.addEventListener('change', (e) => {
            const {id, value} = e.target;
            bills[id].payedValue = value;
    
            bills = calcBills(bills);
            fillData();
        });
    }
}

function updateTable() {
    if (confirm("Você tem certeza que deseja atualizar os dados? \nEsta ação apagará os valores inseridos na tabela abaixo.")) {
        userContractLocal.add(getUserInputs());
        userContract = loadUserData();
        createTableRows();
        bills = calcBills();
        fillData();
        setInputs();
    }
}

createTableRows();
fillData();
setInputs();

update.addEventListener('click', updateTable);
