"use client";

import React, { useState } from "react";

export default function ManagerPage() {
  const [search, setSearch] = useState("");
  const team = [
    {
      name: "Marcus Sterling",
      role: "Desenvolvedor front-end",
      status: "Ativo",
      productivity: 92,
    },
    {
      name: "David Chen",
      role: "Back-end",
      status: "Em reunião",
      productivity: 76,
    },
    {
      name: "Valcemar da Silva",
      role: "UX/UI designer",
      status: "Ativo",
      productivity: 88,
    },
  ];

  const filteredTeam = team.filter((member) =>
    member.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-100 to-blue-100 p-8 font-sans">
      <header className="mb-8 rounded-3xl border border-blue-500 bg-blue-700 p-8 text-white shadow-2xl">
        <h1 className="text-4xl font-extrabold">Quadro de gerenciamento</h1>
        <p className="mt-2 text-lg text-blue-100">
          Sistema de gerenciamento de equipe e produtividade
        </p>
      </header>

      <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <h2 className="text-xl font-semibold text-gray-700">Funcionários</h2>
          <p className="mt-3 text-4xl font-bold text-blue-700">24</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <h2 className="text-xl font-semibold text-gray-700">
            Projetos ativos
          </h2>
          <p className="mt-3 text-4xl font-bold text-green-600">7</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <h2 className="text-xl font-semibold text-gray-700">
            Tarefas concluídas
          </h2>
          <p className="mt-3 text-4xl font-bold text-purple-600">128</p>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h2 className="text-2xl font-bold text-gray-800">
            Equipe de trabalho
          </h2>

          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Buscar um funcionário..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl border border-gray-300 px-4 py-2 outline-none shadow-sm transition-all duration-300 focus:scale-105 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />

            <button className="rounded-xl bg-blue-700 px-5 py-2 font-medium text-white shadow-md transition-all duration-300 hover:scale-105 hover:bg-blue-800 hover:shadow-xl">
              Acrescentar funcionário
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200 text-gray-700">
                  <th className="rounded-l-xl p-4 text-left">Nome</th>
                  <th className="p-4 text-left">Cargo</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="rounded-r-xl p-4 text-left">Produtividade</th>
                </tr>
              </thead>

              <tbody>
                {filteredTeam.map((member, index) => (
                  <tr
                    key={index}
                    className="border-b transition-all duration-300 hover:scale-[1.01] hover:bg-blue-50"
                  >
                    <td className="p-4 font-medium text-gray-800">
                      {member.name}
                    </td>

                    <td className="p-4 text-gray-600">{member.role}</td>

                    <td className="p-4">
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-medium shadow-sm ${
                          member.status === "Ativo"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {member.status}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200 shadow-inner">
                        <div
                          className="h-4 rounded-full bg-linear-to-r from-blue-500 to-blue-700 shadow-md transition-all duration-500"
                          style={{ width: `${member.productivity}%` }}
                        />
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        {member.productivity}%
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <footer className="mt-8 text-center text-sm tracking-wide text-gray-500">
        © 2026 Painel de gestão
      </footer>
    </div>
  );
}
