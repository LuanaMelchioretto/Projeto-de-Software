import React, { createContext, useState } from "react";
import { classes as demoClasses } from "../../mocks/classes";

export const ClassContext = createContext(null);

export default function ClassProvider({ children, initialClasses = demoClasses }) {
  const [classes, setClasses] = useState(() => initialClasses.map((schoolClass) => ({ ...schoolClass })));

  function saveClass(draft, classId = null) {
    const existing = classes.find((schoolClass) => schoolClass.id === classId);
    const schoolClass = {
      ...existing,
      id: existing?.id ?? globalThis.crypto.randomUUID(),
      name: draft.name.trim(),
      code: draft.code.trim(),
    };
    setClasses((current) => existing
      ? current.map((item) => item.id === existing.id ? schoolClass : item)
      : [...current, schoolClass]);
    return schoolClass;
  }

  return <ClassContext.Provider value={{ classes, saveClass }}>{children}</ClassContext.Provider>;
}
