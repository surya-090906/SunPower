// Native React page. Data contract: backoffice/ticket_new.
import {
  Fragment,
  cssStyle,
  text,
  FieldGroup,
  Field,
  TextArea,
  SelectField,
  ActionForm,
  CsrfField,
  FaultHint,
  FaultHintsProvider,
} from "@ui/runtime";
export default function Page({ data, state }) {
  return (
    <>
      <FaultHintsProvider hints={data.faultHints || {}}>
        {"\n"}
        <div className={"page-head"}>
          <div>
            <a
              className={"small"}
              href={"/app/help/customer/" + text(data.v1) + "/"}
            >
              {"‹ "}
              {data.v2}
            </a>
            <h1 style={cssStyle("margin-top:.3rem")}>
              {"Open a service ticket"}
            </h1>
            <div className={"sub"}>
              {data.v3}
              {" · "}
              {data.v4}
            </div>
          </div>
        </div>
        {"\n"}
        <ActionForm
          method={"post"}
          className={"stack"}
          style={cssStyle("max-width:760px")}
        >
          <CsrfField />
          <Field type={"hidden"} name={"customer"} value={text(data.v5)} />
          {"\n  "}
          <div className={"card"}>
            <div className={"card-h"}>
              <h2>{"Which unit has the fault?"}</h2>
            </div>
            <div className={"card-b"}>
              {"\n    "}
              {data.rows6?.length ? (
                data.rows6.map((row6, index) => (
                  <Fragment key={index}>
                    <label
                      className={"check"}
                      style={cssStyle(
                        "padding:.6rem 0;border-bottom:1px solid var(--line)",
                      )}
                    >
                      <Field
                        type={"radio"}
                        name={"serial"}
                        value={text(row6.v7)}
                        {...(row6.attr8 === 0 ? { checked: true } : {})}
                      />
                      {"\n      "}
                      <span className={"grow"}>
                        <b>{row6.v9}</b>{" "}
                        <span className={"badge " + text(row6.v10)}>
                          {row6.v11}
                        </span>
                        <br />
                        <span className={"mono small muted"}>
                          {row6.v12}
                          {" · "}
                          {row6.v13}
                        </span>
                      </span>
                    </label>
                    {"\n    "}
                  </Fragment>
                ))
              ) : (
                <>
                  <div className={"muted"}>
                    {"This customer has no delivered equipment."}
                  </div>
                </>
              )}
              {"\n    "}
              <p className={"hint mt-s"}>
                {
                  "The warranty verdict appears the moment the ticket is created."
                }
              </p>
            </div>
          </div>
          {"\n  "}
          <div className={"card"}>
            <div className={"card-b"}>
              <div className={"fields"}>
                {"\n    "}
                <FieldGroup className={"field"}>
                  <label>{"Fault code on the inverter"}</label>
                  {"\n      "}
                  <Field
                    className={"inp"}
                    name={"fault_code"}
                    id={"f-code"}
                    value={text(data.v14)}
                    list={"codes"}
                    placeholder={"E04"}
                  />
                  {"\n      "}
                  <datalist id={"codes"}>
                    {"\n        "}
                    {data.rows15?.length ? (
                      data.rows15.map((row15, index) => (
                        <Fragment key={index}>
                          <option value={text(row15.v16)}>{row15.v17}</option>
                        </Fragment>
                      ))
                    ) : (
                      <></>
                    )}
                    {"\n      "}
                  </datalist>
                  {"\n      "}
                  <FaultHint
                    id={"code-hint-box"}
                    className={"small mt-s"}
                    style={cssStyle(
                      "display:none;color:var(--brand-ink);background:var(--brand-soft);padding:.4rem .6rem;border-radius:6px;border-left:3px solid var(--brand)",
                    )}
                  >
                    {"\n        💡 "}
                    <b>{"Diagnostic hint:"}</b>{" "}
                    <span id={"code-hint-text"}></span>
                    {"\n      "}
                  </FaultHint>
                  {"\n    "}
                </FieldGroup>
                {"\n    "}
                <FieldGroup className={"field"}>
                  <label>{"Reported via"}</label>
                  <SelectField className={"inp"} name={"source"}>
                    <option value={"call"}>{"Phone call"}</option>
                    <option value={"whatsapp"}>{"WhatsApp"}</option>
                    <option value={"staff"}>{"Raised by staff"}</option>
                  </SelectField>
                </FieldGroup>
                {"\n    "}
                <FieldGroup className={"field full"}>
                  <label>{"What is happening?"}</label>
                  <TextArea
                    className={"inp"}
                    name={"description"}
                    rows={"3"}
                    placeholder={
                      "For example: no power since the rain last night, inverter shows a fault code"
                    }
                  >
                    {data.v18}
                  </TextArea>
                </FieldGroup>
              </div>
            </div>
          </div>
          {"\n  "}
          <div>
            <button className={"btn btn-primary btn-lg"}>
              {"Open ticket"}
            </button>
          </div>
          {"\n"}
        </ActionForm>
        {"\n\n\n"}
      </FaultHintsProvider>
    </>
  );
}
