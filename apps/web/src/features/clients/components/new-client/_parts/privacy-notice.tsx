export interface PrivacyNoticeProps {
  version: string;
}

/**
 * Scrollable privacy notice block.
 * Mirrors prototype lines 523-530.
 */
export function PrivacyNotice({ version: _version }: PrivacyNoticeProps) {
  return (
    <div className="bg-white border border-line rounded-lg p-4 max-h-[220px] overflow-auto text-[16.5px] leading-relaxed text-ink/80">
      <p className="m-0 mb-2 font-bold text-[16px] text-ink">
        Aviso de privacidad simplificado · L&apos;Oréal Luxe México
      </p>
      <p className="m-0 mb-2">
        L&apos;Oréal México, S.A. de C.V. (&ldquo;L&apos;Oréal&rdquo;), con domicilio en Av. Paseo de
        la Reforma, Ciudad de México, es responsable del tratamiento de tus datos personales conforme
        a la LFPDPPP.
      </p>
      <p className="m-0 mb-2">
        <strong>Datos recabados:</strong> nombre, contacto, fecha de nacimiento, género,
        preferencias de belleza, historial de compras y comunicaciones.
      </p>
      <p className="m-0 mb-2">
        <strong>Finalidades:</strong> brindar atención personalizada de clienteling, recomendar
        productos, registrar consentimientos, y enviar comunicaciones por los canales que autorices.
      </p>
      <p className="m-0 mb-2">
        <strong>Transferencias:</strong> a empresas del Grupo L&apos;Oréal y proveedores técnicos
        bajo contrato; nunca a terceros con fines comerciales sin consentimiento adicional.
      </p>
      <p className="m-0">
        <strong>Derechos ARCO:</strong> Acceso, Rectificación, Cancelación u Oposición en{" "}
        <span className="underline">privacidad.mx@loreal.com</span>.
      </p>
    </div>
  );
}
