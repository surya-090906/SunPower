// Native React page. Data contract: backoffice/quick_add.
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
  QuickAddExtractor,
} from "@ui/runtime";
export default function Page({ data, state }) {
  return (
    <>
      <QuickAddExtractor />
      {"\n"}
      <div className={"page-head"}>
        <div>
          <h1>{"Log a call or WhatsApp enquiry"}</h1>
          <div className={"sub"}>
            {
              "For customers who phone or message instead of using the web form. They can activate a portal login later."
            }
          </div>
        </div>
      </div>
      {"\n\n"}
      <ActionForm
        method={"post"}
        className={"card"}
        style={cssStyle("max-width:820px")}
      >
        <div className={"card-b"}>
          <CsrfField />
          {"\n  "}
          <div className={"fields"}>
            {"\n    "}
            <FieldGroup className={"field"}>
              <label>{"Channel"}</label>
              <SelectField className={"inp"} name={"source"} id={"f-source"}>
                <option value={"call"}>{"Phone call"}</option>
                <option value={"whatsapp"}>{"WhatsApp"}</option>
              </SelectField>
            </FieldGroup>
            {"\n    "}
            <FieldGroup className={"field"}>
              <label>{"Property"}</label>
              <SelectField className={"inp"} name={"segment"}>
                <option value={"home"}>{"Home"}</option>
                <option value={"factory"}>{"Small factory"}</option>
              </SelectField>
            </FieldGroup>
            {"\n    "}
            <FieldGroup className={"field"}>
              <label>{"Full name"}</label>
              <Field
                className={"inp"}
                name={"name"}
                id={"f-name"}
                value={text(data.v1)}
                required={true}
              />
            </FieldGroup>
            {"\n    "}
            <FieldGroup className={"field"}>
              <label>{"Mobile number"}</label>
              <Field
                className={"inp"}
                name={"phone"}
                id={"f-phone"}
                value={text(data.v2)}
                inputMode={"numeric"}
                required={true}
              />
            </FieldGroup>
            {"\n    "}
            <FieldGroup className={"field full"}>
              <label>{"Installation address"}</label>
              <TextArea
                className={"inp"}
                name={"address"}
                id={"f-address"}
                rows={"2"}
                required={true}
              >
                {data.v3}
              </TextArea>
            </FieldGroup>
            {"\n    "}
            <FieldGroup className={"field"}>
              <label>{"City"}</label>
              <Field
                className={"inp"}
                name={"city"}
                id={"f-city"}
                value={text(data.v4)}
              />
            </FieldGroup>
            {"\n    "}
            <FieldGroup className={"field"}>
              <label>{"Pincode"}</label>
              <Field
                className={"inp"}
                name={"pincode"}
                id={"f-pincode"}
                value={text(data.v5)}
                inputMode={"numeric"}
                maxLength={"6"}
                required={true}
              />
            </FieldGroup>
            {"\n    "}
            <FieldGroup className={"field"}>
              <label>{"System"}</label>
              <SelectField className={"inp"} name={"package"} id={"f-package"}>
                <option value={"ongrid"}>{"On-Grid"}</option>
                <option value={"offgrid"}>{"Off-Grid"}</option>
                <option value={"panelset"}>{"Panel set only"}</option>
                <option value={"unsure"}>{"Not sure"}</option>
              </SelectField>
            </FieldGroup>
            {"\n    "}
            <FieldGroup className={"field"}>
              <label>{"Capacity"}</label>
              <SelectField className={"inp"} name={"kw"} id={"f-kw"}>
                {data.rows6?.length ? (
                  data.rows6.map((row6, index) => (
                    <Fragment key={index}>
                      <option
                        value={text(row6.v7)}
                        {...(row6.attr8 === 0 ? { selected: true } : {})}
                      >
                        {row6.v9}
                        {" kW"}
                      </option>
                    </Fragment>
                  ))
                ) : (
                  <></>
                )}
              </SelectField>
            </FieldGroup>
            {"\n    "}
            <FieldGroup className={"field"}>
              <label>{"Monthly bill (₹)"}</label>
              <Field
                className={"inp"}
                name={"bill"}
                id={"f-bill"}
                inputMode={"numeric"}
              />
            </FieldGroup>
            {"\n    "}
            <FieldGroup className={"field"}>
              <label>{"Roof area (sq ft)"}</label>
              <Field
                className={"inp"}
                name={"area"}
                id={"f-area"}
                inputMode={"numeric"}
              />
            </FieldGroup>
            {"\n    "}
            <label className={"check full"}>
              <Field
                type={"checkbox"}
                name={"subsidy"}
                id={"f-subsidy"}
                value={"1"}
              />
              <span>{"Customer wants the government subsidy"}</span>
            </label>
            {"\n    "}
            <FieldGroup className={"field full"}>
              <label>{"Notes"}</label>
              <TextArea
                className={"inp"}
                name={"notes"}
                id={"f-notes"}
                rows={"2"}
              >
                {data.v10}
              </TextArea>
            </FieldGroup>
            {"\n  "}
          </div>
          {"\n  "}
          <button className={"btn btn-primary mt"}>{"Log enquiry"}</button>
          {"\n"}
        </div>
      </ActionForm>
      {"\n\n\n"}
    </>
  );
}
