'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type Mode = 'urgencias' | 'consultorio';

interface ChatConfigContextValue {
  mode: Mode;
  summaryFormat: string;
  setSummaryFormat: (value: string) => void;
  keyInfo: string;
  setKeyInfo: (value: string) => void;
  triageCriteria: string;
  setTriageCriteria: (value: string) => void;
  configLocked: boolean;
  lockConfig: () => void;
  chatLocked: boolean;
  setChatLocked: (locked: boolean) => void;
  resetConfig: () => void;
}

const defaultSummaryFormat = `MOTIVO DE CONSULTA:
  

ANTECEDENTES PERSONALES:
- ENFERMEDADES PREVIAS/CRÓNICAS:
- INTERNACIONES:
-  ALERGIAS:
-  VACUNAS:
-  ALCOHOL:
-  TABACO:
-  DROGAS:
-  CIRUGÍAS:
-  GINECOLÓGICOS:
-  DIETA:
-  EJERCICIO:
-  TRATAMIENTO HABITUAL:

ANTECEDENTES FAMILIARES:
`;

const defaultKeyInfo = `Sexo\n Edad\n Enfermedades previas o crónicas importantes\n Síntomas clave del problema principal (inicio, duración, intensidad, localización/lateralidad, curso, desencadenantes/alivio, síntomas asociados relevantes)\n Banderas rojas del motivo\n Antecedentes y riesgos pertinentes al caso (no todos si no cambian la conducta): ENFERMEDADES PREVIAS/CRÓNICAS, INTERNACIONES, ALERGIAS, VACUNAS, ALCOHOL, TABACO, DROGAS, CIRUGÍAS, GINECOLÓGICOS, DIETA, EJERCICIO, TRATAMIENTO HABITUAL`;

const defaultTriageCriteria = `Rojo: Paro cardíaco, dificultad respiratoria severa, hemorragia incontrolable.
Naranja: Dolor torácico agudo, fractura expuesta, convulsiones.
Amarillo: Fiebre alta, dolor abdominal moderado, heridas leves.
Verde: Dolor de cabeza leve, resfriado común, esguince leve.
Azul: Cita de seguimiento, solicitud de receta, malestar general leve.`;

const ChatConfigContext = createContext<ChatConfigContextValue | undefined>(undefined);

export function ChatConfigProvider({ mode, children }: { mode: Mode; children: ReactNode }) {
  const [summaryFormat, setSummaryFormat] = useState<string>(defaultSummaryFormat);
  const [keyInfo, setKeyInfo] = useState<string>(defaultKeyInfo);
  const [triageCriteria, setTriageCriteria] = useState<string>(defaultTriageCriteria);
  const [configLocked, setConfigLocked] = useState<boolean>(false);
  const [chatLocked, setChatLocked] = useState<boolean>(false);

  const lockConfig = () => {
    if (!configLocked) {
      setConfigLocked(true);
    }
  };

  const resetConfig = () => {
    if (configLocked || chatLocked) return;
    setSummaryFormat(defaultSummaryFormat);
    setKeyInfo(defaultKeyInfo);
    setTriageCriteria(defaultTriageCriteria);
  };

  const value: ChatConfigContextValue = useMemo(() => ({
    mode,
    summaryFormat,
    setSummaryFormat,
    keyInfo,
    setKeyInfo,
    triageCriteria,
    setTriageCriteria,
    configLocked,
    lockConfig,
    chatLocked,
    setChatLocked,
    resetConfig,
  }), [mode, summaryFormat, keyInfo, triageCriteria, configLocked, chatLocked]);

  return (
    <ChatConfigContext.Provider value={value}>
      {children}
    </ChatConfigContext.Provider>
  );
}

export function useChatConfig(): ChatConfigContextValue {
  const ctx = useContext(ChatConfigContext);
  if (!ctx) throw new Error('useChatConfig must be used within ChatConfigProvider');
  return ctx;
}


