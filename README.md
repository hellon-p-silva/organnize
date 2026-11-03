# Organnize — sua vida organizada.

App web em português, mobile-first, instalável (PWA) e 100% offline. Todos os dados ficam no `localStorage` do aparelho, separados por usuário (`u:<usuario>::<chave>`).

## Rodar

```bash
npm install
npm run dev      # desenvolvimento
npm run build    # checa tipos + gera dist/
npm run preview  # testa o build (PWA/offline funciona aqui)
```

Para hospedar, publique a pasta `dist/` em qualquer host estático com HTTPS (Vercel, Netlify, GitHub Pages). O botão "Instalar app" só aparece em HTTPS.

## Imagens do treino (opcional)

Coloque `public/guia/treino-a.jpg`, `treino-b.jpg` e `treino-c.jpg` para virem como padrão no botão "Guia". Sem elas, o usuário pode escolher uma imagem do celular dentro do próprio app.

## Estrutura

- `src/lib/*-data.ts` — tipos e regras de cada aba
- `src/hooks/use-*.ts` — estado de cada aba, todos sobre `usePersistentState(chave, padrão)`
- `src/components/*Panel.tsx` — uma tela por aba
- `public/sw.js` + `public/manifest.json` — PWA/offline

## APK Android (Capacitor)

O projeto Android fica em `android/` (app `com.organnize.app`). No app nativo, o botão "Instalar app" some, as fontes vêm junto no pacote (funciona sem internet) e o botão Voltar do Android fecha o modal aberto ou sai do app.

**Pelo GitHub (sem instalar nada):** envie este projeto para um repositório no GitHub. O workflow `.github/workflows/android.yml` compila o APK a cada push na `main` e publica em **Releases → apk-latest → Organnize.apk**. Abra esse link no celular, baixe e instale (permita "instalar apps desconhecidos" quando o Android pedir).

**No computador (Android Studio):**

```bash
npm install
npm run android:sync   # build web + copia para android/
npm run android:open   # abre no Android Studio → Build → Build APK(s)
```

O APK gerado é de depuração (debug): instala normalmente fora da Play Store. Para publicar na Play Store é preciso gerar um build de release assinado com a sua chave.
