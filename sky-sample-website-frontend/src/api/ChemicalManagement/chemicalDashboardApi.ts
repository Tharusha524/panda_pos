import axios from "axios";

export async function fetchChemicalStockAmount(
  startDate: String,
  endDate: String,
  division: String
) {
  const res = await axios.get(
    `api/chemical-dashboard/${startDate}/${endDate}/${division}/stock-amount`
  );
  return res.data;
}

export async function fetchChemicalMonthlyDelivery(
  startDate: String,
  endDate: String,
  division: String
) {
  const res = await axios.get(
    `api/chemical-dashboard/${startDate}/${endDate}/${division}/monthly-delivery`
  );
  return res.data;
}

export async function fetchChemicalTransactionLatestRecord(
  startDate: String,
  endDate: String,
  division: String
) {
  const res = await axios.get(
    `api/chemical-dashboard/${startDate}/${endDate}/${division}/latest-record`
  );
  return res.data;
}

export async function fetchChemicalMonthlyLatestRecord(
  startDate: String,
  endDate: String,
  division: String
) {
  const res = await axios.get(
    `api/chemical-dashboard/${startDate}/${endDate}/${division}/transaction-latest-record`
  );
  return res.data;
}

export async function fetchChemicalThreshold(
  startDate: String,
  endDate: String,
  division: String
) {
  const res = await axios.get(
    `api/chemical-dashboard/${startDate}/${endDate}/${division}/stock-threshold`
  );
  return res.data;
}

export async function fetchChemicalHighestStock(
  startDate: String,
  endDate: String,
  division: String
) {
  const res = await axios.get(
    `api/chemical-dashboard/${startDate}/${endDate}/${division}/highest-stock`
  );
  return res.data;
}

export async function fetchChemicalStatusSummery(
  startDate: String,
  endDate: String,
  division: String
) {
  const res = await axios.get(
    `api/chemical-dashboard/${startDate}/${endDate}/${division}/status-summary`
  );
  return res.data;
}

export async function fetchChemicalInventoryInsights(
  startDate: String,
  endDate: String,
  division: String
) {
  const res = await axios.get(
    `api/chemical-dashboard/${startDate}/${endDate}/${division}/chemical-inventory-insights`
  );
  return res.data;
}

export async function fetchChemicalClassification(
  startDate: String,
  endDate: String,
  division: String
) {
  const res = await axios.get(
    `api/chemical-dashboard/${startDate}/${endDate}/${division}/category-and-classification
    `
  );
  return res.data;
}

export async function fetchChemicalDashboardAllSummary(year: number) {
  const res = await axios.get(`api/chemical-dashboard/${year}/all-summary`);
  return res.data;
}

export async function fetchMsdsCount(
  startDate: String,
  endDate: String,
  division: String
) {
  const res = await axios.get(
    `api/chemical-dashboard/${startDate}/${endDate}/${division}/do-you-have-msds
    `
  );
  return res.data;
}