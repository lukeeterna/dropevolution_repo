import os

# Roadmap integrata secondo le indicazioni di Claude:
# 1. Analizza il seguente file Python come parte di un progetto SaaS di automazione dropshipping.
# 2. Per ciascun file, fornisci: errori, bug logici, suggerimenti di refactoring, ottimizzazione performance, controlli di sicurezza e test consigliati.
# 3. Punti critici da segnalare: sicurezza JWT (revoca token, claims mancanti), gestione segreti, endpoint mancanti, logging avanzato, testing integrato.
# 4. Suggerisci se applicare Service/Repository Pattern, dependency injection, alerting con Prometheus e Grafana, scaling Redis e fallback resilienza.


def generate_copilot_review_prompt(repo_path, output_file):
    prompt_header = ("Analizza il seguente file Python come parte di un progetto SaaS di automazione dropshipping. "
                     "Per ciascun file, fornisci: errori, bug logici, suggerimenti di refactoring, "
                     "ottimizzazione performance, controlli di sicurezza e test consigliati. "
                     "Verifica se occorre migliorare JWT security (revoca token, claims), gestione segreti, completare endpoint, logging avanzato e test. "
                     "Suggerisci se introdurre pattern architetturali, Prometheus/Grafana, caching Redis e strategie di resilienza.")

    with open(output_file, "w", encoding="utf-8") as out_file:
        for root, _, files in os.walk(repo_path):
            for file in files:
                if file.endswith(".py"):
                    file_path = os.path.join(root, file)
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                    out_file.write(f"{'='*80}\n")
                    out_file.write(f"FILE: {file_path}\n")
                    out_file.write(f"{'='*80}\n")
                    out_file.write(prompt_header)
                    out_file.write("\nCodice sorgente:\n")
                    out_file.write(content)
                    out_file.write("\n\nRisultato dell'analisi: (scrivi qui sotto)\n\n")

    print(f"Report generato in {output_file}")

# Imposta i percorsi
repo_directory = "/Users/macbook/Desktop/dropevolution_repo"
report_output = "/Users/macbook/Desktop/dropevolution_repo/github/scripts/copilot_code_review_report.txt"

generate_copilot_review_prompt(repo_directory, report_output)
