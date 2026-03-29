// src/services/api.js
import { supabase } from "./supabaseClient";

const wrap = async (queryPromise) => {
  const { data, error } = await queryPromise;
  if (error) {
    throw error;
  }
  return { data };
};

// Funções para Clientes
export const getClients = () => wrap(supabase.from("clients").select("*"));
export const getClientById = (id) =>
  wrap(supabase.from("clients").select("*").eq("id", id).single());
export const createClient = (clientData) =>
  wrap(supabase.from("clients").insert(clientData));
export const updateClient = (id, clientData) =>
  wrap(supabase.from("clients").update(clientData).eq("id", id));
export const deleteClient = (id) =>
  wrap(supabase.from("clients").delete().eq("id", id));

// Funções para Transações
export const getTransactions = () =>
  wrap(supabase.from("transactions").select("*"));
export const createTransaction = (transactionData) =>
  wrap(supabase.from("transactions").insert(transactionData));
export const updateTransaction = (id, transactionData) =>
  wrap(supabase.from("transactions").update(transactionData).eq("id", id));
export const deleteTransaction = (id) =>
  wrap(supabase.from("transactions").delete().eq("id", id));

// Funções para Empréstimos
export const getLoans = () => wrap(supabase.from("loans").select("*"));
export const createLoan = (loanData) =>
  wrap(supabase.from("loans").insert(loanData));
export const updateLoan = (id, loanData) =>
  wrap(supabase.from("loans").update(loanData).eq("id", id));
export const deleteLoan = (id) =>
  wrap(supabase.from("loans").delete().eq("id", id));

// Funções para Vendas
export const getSales = () => wrap(supabase.from("sales").select("*"));
export const createSale = (saleData) =>
  wrap(supabase.from("sales").insert(saleData));
export const updateSale = (id, saleData) =>
  wrap(supabase.from("sales").update(saleData).eq("id", id));
export const deleteSale = (id) =>
  wrap(supabase.from("sales").delete().eq("id", id));

// Funções para Veículos
export const getVehicles = () => wrap(supabase.from("vehicles").select("*"));
export const createVehicle = (vehicleData) =>
  wrap(supabase.from("vehicles").insert(vehicleData));
export const updateVehicle = (id, vehicleData) =>
  wrap(supabase.from("vehicles").update(vehicleData).eq("id", id));
export const deleteVehicle = (id) =>
  wrap(supabase.from("vehicles").delete().eq("id", id));

// Funções para Funcionários
export const getEmployees = () => wrap(supabase.from("employees").select("*"));
export const createEmployee = (employeeData) =>
  wrap(supabase.from("employees").insert(employeeData));
export const updateEmployee = (id, employeeData) =>
  wrap(supabase.from("employees").update(employeeData).eq("id", id));
export const deleteEmployee = (id) =>
  wrap(supabase.from("employees").delete().eq("id", id));

// Funções para Notificações
export const getNotifications = () =>
  wrap(supabase.from("notifications").select("*"));
export const createNotification = (notificationData) =>
  wrap(supabase.from("notifications").insert(notificationData));
export const updateNotification = (id, notificationData) =>
  wrap(supabase.from("notifications").update(notificationData).eq("id", id));
export const deleteNotification = (id) =>
  wrap(supabase.from("notifications").delete().eq("id", id));
