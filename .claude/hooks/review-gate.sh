#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel 2>/dev/null)" || exit 0
STATE_FILE="$ROOT/.claude/.review-state"
cd "$ROOT"

fingerprint() {
  {
    git diff HEAD -- . ':(exclude).claude/.review-state' 2>/dev/null
    git ls-files --others --exclude-standard -z -- . ':(exclude).claude/.review-state' 2>/dev/null \
      | xargs -0 -r sha1sum 2>/dev/null
  } | sha1sum | cut -d' ' -f1
}

has_changes() {
  [ -n "$(git status --porcelain -- . ':(exclude).claude/.review-state' 2>/dev/null)" ]
}

if [ "${1:-}" = "--mark" ]; then
  fingerprint > "$STATE_FILE"
  echo "Estado atual marcado como revisado."
  exit 0
fi

INPUT="$(cat || true)"
if printf '%s' "$INPUT" | grep -Eq '"stop_hook_active"[[:space:]]*:[[:space:]]*true'; then
  exit 0
fi

has_changes || exit 0

CURRENT="$(fingerprint)"
if [ -f "$STATE_FILE" ] && [ "$(cat "$STATE_FILE")" = "$CURRENT" ]; then
  exit 0
fi

cat <<'JSON'
{"decision":"block","reason":"Revisão obrigatória antes de concluir: há mudanças de código ainda não revisadas. Lance AGORA, em paralelo (na mesma mensagem), os agentes `security-reviewer`, `quality-reviewer` e `design-reviewer` com a ferramenta Agent (o `design-reviewer` pode dizer que não houve mudança de interface). No prompt de cada um, descreva a demanda que foi concluída (inclusive o pedido do usuário), os arquivos alterados e o que merece atenção (eles começam sem o contexto desta conversa). Quando os três responderem: corrija os achados confirmados que forem da demanda atual, rode de novo lint, typecheck e testes, e então rode `.claude/hooks/review-gate.sh --mark`. No resumo final para o usuário, inclua o veredito de cada revisor e o que foi corrigido ou ficou pendente. Se a demanda não envolveu código (só conversa ou docs triviais), explique isso em uma linha e rode `.claude/hooks/review-gate.sh --mark` sem lançar os agentes."}
JSON
