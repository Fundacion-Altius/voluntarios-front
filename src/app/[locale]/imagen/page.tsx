import Image from "next/image";
export default function DerechosImagen() {
  return (
    <div className="contract-wizard docs">
      <Image alt="logo" src={"/logo.png"} width={400} height={100}></Image>
      <h2> INFORMACIÓN Y CONSENTIMIENTO DE USO DE IMÁGENES</h2>
      <p>
        De conformidad con la Ley Orgánica 1/1982, de 5 de mayo, de protección
        del derecho al honor, intimidad y propia imagen, le informamos que la
        Fundación puede captar imágenes en las que aparece, siempre y cuando las
        mismas tengan relación con el voluntariado en el que participa. Las
        citadas imágenes serán empleadas de forma exclusiva, sin ningún tipo de
        limitación geográfica, y a título gratuito, para la elaboración de
        publicaciones internas que realice la Fundación en relación con su
        actividad, y que incluirán de forma enunciativa y no exhaustiva la
        agenda, exposiciones, página web, Facebook, videos de la Fundación, así
        como para acometer acciones promocionales de la citada Fundación entre
        las que se incluyen, sin que la presente enumeración tenga carácter
        limitativo, la captación, reproducción, grabación y distribución por
        cualquier medio, así como la exposición de los materiales elaborados,
        indistintamente del soporte en el que los mismos sean empleados,
        incluyendo redes sociales que son administradas y gestionadas desde la
        propia Fundación. Asimismo, consienten que además de la información
        gráfica que incluyan su imagen en fotos de grupos o individual, pueda
        aparecer su nombre, edad u otros datos personales.
      </p>
      <p>
        En cumplimiento del art. 13 del RGPD, se informa que en cualquier
        momento podrán retirar el consentimiento al tratamiento y presentar una
        reclamación ante la autoridad de control competente en el caso de
        incumplimiento de lo establecido en el RGPD.
      </p>
      <p>
        Para contactar con el Delegado de Protección de Datos, puede enviar un
        email a la siguiente dirección de correo electrónico:<a href="mailto: dpo@serviciosrc.es"> dpo@serviciosrc.es</a>
      </p>
      <p>
        Podrá ejercer su derecho de acceso, rectificación, supresión, limitación
        del tratamiento, portabilidad de los datos y cancelación al tratamiento
        de sus datos personales enviando un escrito a Fundación Altius España,
        Ronda de Segovia 34, 28005, Madrid o mediante el envío de un correo
        electrónico a<a href="mailto:derechos.lopd@fundacionaltius.org ">derechos.lopd@fundacionaltius.org</a> en los términos y condiciones previstos en el RGPD y la propia LOPDGDD.
      </p>
    </div>
  );
}
