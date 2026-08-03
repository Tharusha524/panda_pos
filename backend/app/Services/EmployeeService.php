<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\User;
use Exception;

class EmployeeService
{
    public function __construct(
        private CompanySettingService $companySettingService,
        private EmployeeSettingService $employeeSettingService,
        private PaymentService $paymentService,
    ) {
    }

    public function getAllForUser(User $user)
    {
        $company = $this->companySettingService->getCompanyForUser($user);

        return Employee::where('company_id', $company->id)
            ->orderByRaw('CAST(employee_code AS UNSIGNED), employee_code')
            ->orderBy('id')
            ->get()
            ->map(fn (Employee $e) => $this->formatEmployee($e));
    }

    public function createForUser(User $user, array $data): array
    {
        $company = $this->companySettingService->getCompanyForUser($user);

        $employeeCode = null;
        if ($this->employeeSettingService->isAutoNumberEnabled($user)) {
            $employeeCode = $this->nextEmployeeCode($company->id);
        } elseif (!empty($data['employee_code'])) {
            $employeeCode = (string) $data['employee_code'];
        }

        $employee = Employee::create([
            'company_id' => $company->id,
            'employee_code' => $employeeCode,
            'name' => $data['name'],
            'phone' => $data['phone'] ?? null,
            'address' => $data['address'] ?? null,
            'monthly_salary' => round((float) ($data['monthly_salary'] ?? 0), 2),
            'is_active' => $data['is_active'] ?? true,
        ]);

        $this->paymentService->syncFromEmployeeSalary($employee);

        return $this->formatEmployee($employee);
    }

    public function updateForUser(User $user, int $id, array $data): array
    {
        $employee = $this->findForUser($user, $id);

        $payload = [];
        foreach (['name', 'phone', 'address', 'is_active', 'monthly_salary'] as $field) {
            if (array_key_exists($field, $data)) {
                $payload[$field] = $field === 'monthly_salary'
                    ? round((float) $data[$field], 2)
                    : $data[$field];
            }
        }

        if (array_key_exists('employee_code', $data) && !$this->employeeSettingService->isAutoNumberEnabled($user)) {
            $payload['employee_code'] = $data['employee_code'];
        }

        if ($payload !== []) {
            $employee->update($payload);
        }

        $employee = $employee->fresh();
        $this->paymentService->syncFromEmployeeSalary($employee);

        return $this->formatEmployee($employee);
    }

    public function deleteForUser(User $user, int $id): void
    {
        $employee = $this->findForUser($user, $id);
        $companyId = $employee->company_id;
        $employeeId = $employee->id;
        $employee->delete();
        $this->paymentService->deleteBySource($companyId, PaymentService::SOURCE_SALARY, $employeeId);
    }

    private function findForUser(User $user, int $id): Employee
    {
        $company = $this->companySettingService->getCompanyForUser($user);

        $employee = Employee::where('company_id', $company->id)->where('id', $id)->first();

        if (!$employee) {
            throw new Exception('Employee not found');
        }

        return $employee;
    }

    private function nextEmployeeCode(int $companyId): string
    {
        $max = Employee::where('company_id', $companyId)
            ->whereNotNull('employee_code')
            ->pluck('employee_code')
            ->map(fn ($code) => (int) preg_replace('/\D/', '', (string) $code))
            ->max();

        return (string) (($max ?? 0) + 1);
    }

    private function formatEmployee(Employee $employee): array
    {
        return [
            'id' => $employee->id,
            'company_id' => $employee->company_id,
            'employee_code' => $employee->employee_code,
            'display_id' => $employee->employee_code ?? (string) $employee->id,
            'name' => $employee->name,
            'phone' => $employee->phone ?? '',
            'address' => $employee->address ?? '',
            'monthly_salary' => (float) $employee->monthly_salary,
            'is_active' => (bool) $employee->is_active,
        ];
    }
}
