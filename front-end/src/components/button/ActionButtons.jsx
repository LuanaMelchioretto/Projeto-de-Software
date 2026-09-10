import React, { forwardRef } from "react";
import { ChevronUp, Eye, Pencil, Plus } from "lucide-react";
import Button from "./Button";

export const CreateButton = forwardRef(function CreateButton({ children = "Criar", ...props }, ref) {
  return <Button {...props} ref={ref} variant="primary" icon={Plus}>{children}</Button>;
});

export const ViewButton = forwardRef(function ViewButton({ expanded, children, ...props }, ref) {
  return (
    <Button {...props} ref={ref} variant="text" icon={expanded ? ChevronUp : Eye} aria-expanded={expanded}>
      {children ?? (expanded ? "Recolher" : "Visualizar")}
    </Button>
  );
});

export const EditButton = forwardRef(function EditButton({ children = "Editar", ...props }, ref) {
  return <Button {...props} ref={ref} variant="secondary" icon={Pencil}>{children}</Button>;
});
