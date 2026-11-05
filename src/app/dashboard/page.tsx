import { requireSession } from "@/lib/auth/session";
import { IncomeExpenseChart } from "@/components/charts/income-expense-chart";
import { ExpenseDonut } from "@/components/charts/expense-donut";
import { CashFlowChart } from "@/components/charts/cash-flow-chart";
import { EmployeesTable, ExpenseByCategory, IncomeBySource, RecentTransactions, SummaryCards, TopClients } from "@/components/widgets";

export default async function DashboardPage() {
  await requireSession();
  return (
    <>
      <SummaryCards />
      <div className="row-2">
        <ExpenseDonut />
        <IncomeExpenseChart />
      </div>
      <div className="row-3">
        <CashFlowChart />
        <ExpenseByCategory />
        <IncomeBySource />
      </div>
      <div className="row-4">
        <EmployeesTable />
        <TopClients />
        <RecentTransactions />
      </div>
    </>
  );
}
