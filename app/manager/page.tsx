"use client";

import React, {useState} from "react"

/*{useState}*/

export default function ManagerPage() {
    const [search, setSearch]  = useState("");
    const team = [
        {
            name: "Marcus Sterling",
            role: "Desenvolvedor Front-end",
            status: "Ativo",
            productivity: 92,
        },
        {
            name: "David Chen",
            role: "Back-end",
            status: "Em Reunião",
            productivity: 76,
        },
        {
            name: "Valcemar da Silva",
            role: "UX/UI Designer",
            status: "Ativo",
            productivity: 88,
        },
    ];

    const filteredTeam = team.filter((member) => member.name.toLowerCase().includes(search.toLowerCase()));

    return (<div className="min-h-screen bg-linear-to-br from-gray-100 to-blue-100 p-8 font-sans">
        <header className="bg-blue-700 text-white rounded-3xl shadow-2xl p-8 mb-8 border border-blue-500">
            <h1 className="text-4xl font-extrabold">Quadro de gerenciamento</h1>
            <p className="mt-2 text-lg text-blue-100">
                Sistema de gerenciamento de equipe e produtividade
            </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <h2 className="text-xl font-semibold text-gray-700">
                    Funcionarios
                </h2>
                <p className="text-4xl font-bold text-blue-700 mt-3">24</p>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <h2 className="text-xl font-semibold text-gray-700">
                    Projetos ativos
                </h2>
                <p className="text-4xl font-bold text-green-600 mt-3">7</p>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <h2 className="text-xl font-semibold text-gray-700">
                    Tarefas concluidas
                </h2>
                <p className="text-4xl font-bold text-purple-600 mt-3">128</p>
            </div>
        </section>

        <section className="bg-white rounded-3xl shadow-xl p-6 border border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                    Equipe de Trabalho
                </h2>

                <div className="flex gap-3">
                    <input
                    type="text"
                    placeholder="Buscar um funcionario..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border border-gray-300 rounded-xl px-4 py-2 outline-none shadow-sm transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:scale-105"
                    />

                    <button className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-xl font-medium transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105">
                        Acrescentar Funcionario
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-200 text-gray-700">
                                <th className="text-left p-4 rounded-l-xl">Nome</th>
                                <th className="text-left p-4">Cargo</th>
                                <th className="text-left p-4">Status</th>
                                <th className="text-left p-4 rounded-r-xl">Produtividade</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredTeam.map((member, index) => (
                                <tr
                                key={index}
                                className="border-b hover:bg-blue-50 transition-all duration-300 hover:scale-[1.01]"
                                >
                                    <td className="p-4 font-medium text-gray-800">
                                        {member.name}
                                    </td>

                                    <td className="p-4 text-gray-600">{member.role}</td>

                                    <td className="p-4">
                                        <span
                                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                member.status === "Ativo"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-yellow-100 text-yellow-700"
                                            } shadow-sm`}
                                        >{member.status}</span>
                                        
                                    </td>

                                    <td className="p-4">
                                        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                                            <div className="bg-linear-to-r from-blue-500 to-blue-700 h-4 rounded-full transition-all duration-500 shadow-md" style={{width: `${member.productivity}%` }}></div>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">{member.productivity}%</p>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
        <footer className="mt-8 text-center text-gray-500 text-sm tracking-wide">
            @2026 Manager Page
        </footer>
    </div>)
}