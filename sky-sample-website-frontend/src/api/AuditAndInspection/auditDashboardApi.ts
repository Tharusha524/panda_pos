import axios from "axios";

export async function fetchAuditStatusCount(
  dateFrom: String,
  dateTo: String,
  division: String,
  auditType: String
) {
  const res = await axios.get(
    `api/audit-status-count/${dateFrom}/${dateTo}/${division}/${auditType}/status-count`
  );
  return res.data;
}

export async function fetchAuditScoreCount(
  dateFrom: String,
  dateTo: String,
  division: String,
  auditType: String
) {
  const res = await axios.get(
    `api/audit-status-count/${dateFrom}/${dateTo}/${division}/${auditType}/score-count`
  );
  return res.data;
}

export async function fetchAuditStatusCountByMonth(
  dateFrom: String,
  dateTo: String,
  division: String,
  auditType: String
) {
  const res = await axios.get(
    `api/audit-status-count/${dateFrom}/${dateTo}/${division}/${auditType}/status-count-by-month`
  );
  return res.data;
}

export async function fetchAuditAssignedCompletion(
  dateFrom: String,
  dateTo: String,
  division: String,
  auditType: String
) {
  const res = await axios.get(
    `api/audit-status-count/${dateFrom}/${dateTo}/${division}/${auditType}/assigned-completion`
  );
  return res.data;
}

export async function fetchAuditAssignedGradeStats(
  dateFrom: String,
  dateTo: String,
  division: String,
  auditType: String
) {
  console.log(auditType)
  const res = await axios.get(
    `api/audit-status-count/${dateFrom}/${dateTo}/${division}/External Audit/grade-stats`
  );
  return res.data;
}

export async function fetchAuditAnnouncementStats(
  dateFrom: String,
  dateTo: String,
  division: String,
  auditType: String
) {
  console.log(auditType)
  const res = await axios.get(
    `api/audit-status-count/${dateFrom}/${dateTo}/${division}/External Audit/announcement-stats`
  );
  return res.data;
}

export async function fetchAllDivisionTRecord(
  dateFrom: String,
  dateTo: String,
  division: String,
  auditType: String
) {
  console.log(division)
  const res = await axios.get(
    `api/audit-status-count/${dateFrom}/${dateTo}/${auditType}/all-division-record`
  );
  return res.data;
}

export async function fetchAuditCategoryBreakdown(
  dateFrom: String,
  dateTo: String,
  division: String,
  auditType: String
) {
  console.log(dateFrom)
  console.log(dateTo)
  const res = await axios.get(
    `api/audit-status-count/${division}/${auditType}/select-division-record`
  );
  return res.data;
}

export async function fetchAuditStandardsByDivision(
  dateFrom: String,
  dateTo: String,
  division: String,
  auditType: String
) {
  const res = await axios.get(
    `api/audit-status-count/${dateFrom}/${dateTo}/${division}/${auditType}/audit-standards`
  );
  return res.data;
}

export async function fetchAuditCompletionsByDivision(
  dateFrom: String,
  dateTo: String,
  division: String,
  auditType: String
) {
  const res = await axios.get(
    `api/audit-status-count/${dateFrom}/${dateTo}/${division}/${auditType}/audit-completion-draft`
  );
  return res.data;
}

export async function fetchAuditExpiryAction(
  dateFrom: String,
  dateTo: String,
  division: String,
  auditType: String
) {
  const res = await axios.get(
    `api/audit-status-count/${dateFrom}/${dateTo}/${division}/${auditType}/expiry-action`
  );
  return res.data;
}

export async function fetchAuditTypesByDivision(
  dateFrom: String,
  dateTo: String,
  division: String,
  auditType: String
) {
  const res = await axios.get(
    `api/audit-status-count/${dateFrom}/${dateTo}/${division}/${auditType}/audit-type`
  );
  return res.data;
}

export async function fetchAuditPriorityFindings(
  dateFrom: String,
  dateTo: String,
  division: String,
  auditType: String
) {
  const res = await axios.get(
    `api/audit-status-count/${dateFrom}/${dateTo}/${division}/category-priority-findings`
  );
  return res.data;
}

export async function fetchAuditScore(
  dateFrom: String,
  dateTo: String,
  division: String,
  auditType: String
) {
  const res = await axios.get(
    `api/audit-status-count/${dateFrom}/${dateTo}/${division}/category-score`
  );
  return res.data;
}

export async function fetchUpcomingAuditExpiry(
  dateFrom: String,
  dateTo: String,
  division: String,
  auditType: String
) {
  const res = await axios.get(
    `api/audit-status-count/${dateFrom}/${dateTo}/${division}/upcoming-expiry-audit`
  );
  return res.data;
}