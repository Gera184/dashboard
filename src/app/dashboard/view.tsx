"use client";

import { useMonthData } from "@/lib/use-month-data";
import { Loading } from "@/components/loading";
import { summarize } from "@/lib/data";
import { IncomeExpenseChart } from "@/components/charts/income-expense-chart";
import { ExpenseDonut } from "@/components/charts/expense-donut";
import { CashFlowChart } from "@/components/charts/cash-flow-chart";
import { EmployeesTable, ExpenseByCategory, GettingStarted, IncomeBySource, MonthStats, SummaryCards } from "@/components/widgets";

export function DashboardView() {
  const { store, month } = useMonthData();
  if (!store) return <Loading />;
  const s = summarize(store, month);
  return (
    <>
      {s.totals.count === 0 && <GettingStarted month={month} />}
      <SummaryCards s={s} />
      <MonthStats s={s} />
      <CashFlowChart data={s.cashFlow} />
      <EmployeesTable s={s} />
      <div className="row-2">
        <IncomeBySource s={s} />
        <ExpenseByCategory s={s} />
      </div>
      <div className="row-2">
        <ExpenseDonut data={s.expenseCategories} total={s.totals.expenses} label={s.label} month={month} />
        <IncomeExpenseChart daily={s.daily} weekly={s.weekly} label={s.label} income={s.totals.income} expenses={s.totals.expenses} />
      </div>
    </>
  );
}
