import axios from "axios";
import { z } from "zod";

export async function fetchConsumptionCategoriesSum(
  year: String,
  month: String,
  division: String
) {
  const res = await axios.get(
    `api/environment-record/${year}/${month}/${division}/category-quantity-sum`
  );
  return res.data;
}

export async function fetchConsumptionCategoriesWasteWaterPercentage(
  year: String,
  month: String,
  division: String
) {
  const res = await axios.get(
    `api/environment-record/${year}/${month}/${division}/water-to-waste-water-percentage`
  );
  return res.data;
}

export async function fetchConsumptionCategoriesQuantity(
  year: String,
  division: String
) {
  const res = await axios.get(
    `api/environment-record/${year}/${division}/category-quantity-sum`
  );
  return res.data;
}

export async function fetchConsumptionRenewableEnergy(
  year: String,
  month: String,
  division: String
) {
  const res = await axios.get(
    `api/environment-record/${year}/${month}/${division}/energy-renewable-details`
  );
  return res.data;
}

export async function fetchConsumptionAllDashboardData(
  year: String,
) {
  const res = await axios.get(
    `api/environment-record/${year}/category-record-count-all`
  );
  return res.data;
}

export async function fetchConsumptionScope(
  year: String,
  division: String
) {
  const res = await axios.get(
    `api/environment-record/${year}/${division}/scope-quantity-sum`
  );
  return res.data;
}

export async function fetchConsumptionSourceCounts(
  year: String,
  month: String,
  division: String
) {
  const res = await axios.get(
    `api/environment-record/${year}/${month}/${division}/category-source-quantity-sum`
  );
  return res.data;
}

export async function fetchConsumptionWasteWaterDetails(
  year: String,
  month: String,
  division: String
) {
  const res = await axios.get(
    `api/environment-record/${year}/${month}/${division}/waste-water-details`
  );
  return res.data;
}

export async function fetchConsumptionEnergyRecodeDetails(
  year: String,
  division: String
) {
  const res = await axios.get(
    `api/environment-record/${year}/${division}/energy-record-count-monthly`
  );
  return res.data;
}

export async function fetchConsumptionStatusSummery(
  year: String,
  month: String,
  division: String
) {
  const res = await axios.get(
    `api/environment-record/${year}/${month}/${division}/status-summary`
  );
  return res.data;
}