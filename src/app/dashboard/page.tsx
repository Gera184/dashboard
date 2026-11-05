import { requireSession } from "@/lib/auth/session";
import { readStore } from "@/lib/store";
import { resolveMonth, summarize } from "@/lib/data";
import { IncomeExpenseChart } from "@/components/charts/income-expense-chart";
import { ExpenseDonut } from "@/components/charts/expense-donut";
import { CashFlowChart } from "@/components/charts/cash-flow-chart";
import { EmployeesTable, ExpenseByCategory, GettingStarted, IncomeBySource, SummaryCards } from "@/components/widgets";

type Props = { searchParams: Promise<{ month?: string | string[] }> };

export default async function DashboardPage({ searchParams }: Props) {
  await requireSession();
  const month = resolveMonth((await searchParams).month);
  const s = summarize(await readStore(), month);
  return (
    <>
      {s.totals.count === 0 && <GettingStarted month={month} />}
      <SummaryCards s={s} />
      <div className="row-2">
        <ExpenseDonut data={s.expenseCategories} total={s.totals.expenses} label={s.label} month={month} />
        <IncomeExpenseChart daily={s.daily} weekly={s.weekly} label={s.label} income={s.totals.income} expenses={s.totals.expenses} />
      </div>
      <div className="row-3">
        <CashFlowChart data={s.cashFlow} />
        <ExpenseByCategory s={s} />
        <IncomeBySource s={s} />
      </div>
      <EmployeesTable s={s} />
    </>
  );
}
