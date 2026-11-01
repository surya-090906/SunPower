// Native React page. Data contract: backoffice/receive.
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
  SerialFields,
} from "@ui/runtime";
export default function Page({ data, state }) {
  return (
    <>
      {"\n"}
      <div className={"page-head"}>
        <div>
          <h1>{"Receive stock"}</h1>
          <div className={"sub"}>
            {
              "Serial-tracked items need one serial number each. The cost entered here is what a job is charged when the unit leaves."
            }
          </div>
        </div>
      </div>
      {"\n"}
      <div className={"grid g-main"}>
        {"\n  "}
        <ActionForm method={"post"} className={"card"}>
          <div className={"card-b"}>
            <CsrfField />
            {"\n    "}
            <div className={"fields"}>
              {"\n      "}
              <FieldGroup className={"field"}>
                <label>{"Supplier"}</label>
                <Field
                  className={"inp"}
                  name={"supplier"}
                  value={text(data.v1)}
                  required={true}
                />
              </FieldGroup>
              {"\n      "}
              <FieldGroup className={"field"}>
                <label>{"Supplier invoice / PO"}</label>
                <Field className={"inp"} name={"ref"} value={text(data.v2)} />
              </FieldGroup>
              {"\n      "}
              <FieldGroup className={"field full"}>
                <label>{"Item"}</label>
                <SelectField
                  className={"inp"}
                  name={"product"}
                  data-product-select={true}
                  required={true}
                >
                  <option value={""}>{"Choose…"}</option>
                  {"\n        "}
                  {data.rows3?.length ? (
                    data.rows3.map((row3, index) => (
                      <Fragment key={index}>
                        <option
                          value={text(row3.v4)}
                          data-tracked={
                            row3.choice5 === 0
                              ? "1"
                              : row3.choice5 === 1
                                ? "0"
                                : ""
                          }
                          data-cost={text(row3.v6)}
                          {...(row3.attr7 === 0 ? { selected: true } : {})}
                        >
                          {row3.v8}
                          {" · "}
                          {row3.v9}
                          {row3.choice10 === 0 ? <>{" (serial)"}</> : null}
                        </option>
                      </Fragment>
                    ))
                  ) : (
                    <></>
                  )}
                </SelectField>
              </FieldGroup>
              {"\n      "}
              <FieldGroup className={"field"}>
                <label>{"Quantity"}</label>
                <Field
                  className={"inp"}
                  name={"qty"}
                  value={text(data.v11)}
                  inputMode={"numeric"}
                  required={true}
                />
              </FieldGroup>
              {"\n      "}
              <FieldGroup className={"field"}>
                <label>{"Unit cost (₹)"}</label>
                <Field
                  className={"inp"}
                  name={"cost"}
                  data-cost={true}
                  value={text(data.v12)}
                  inputMode={"decimal"}
                  required={true}
                />
              </FieldGroup>
              {"\n      "}
              <SerialFields className={"field full"} data-serials={true}>
                <label>
                  {"Serial numbers "}
                  <span className={"faint"}>
                    {"one per line, or scan them in"}
                  </span>
                </label>
                <TextArea
                  className={"inp mono"}
                  name={"serials"}
                  rows={"6"}
                  placeholder={"INV3K-200101\nINV3K-200102"}
                >
                  {data.v13}
                </TextArea>
                <span className={"hint"}>
                  {
                    "The count must match the quantity. Duplicates are rejected."
                  }
                </span>
              </SerialFields>
              {"\n    "}
            </div>
            {"\n    "}
            <button className={"btn btn-primary mt"}>
              {"Receive into stock"}
            </button>
            {"\n  "}
          </div>
        </ActionForm>
        {"\n  "}
        <div className={"card"}>
          <div className={"card-h"}>
            <h2>{"Recent receipts"}</h2>
          </div>
          <div className={"card-b"}>
            {data.rows14?.length ? (
              data.rows14.map((row14, index) => (
                <Fragment key={index}>
                  <div
                    className={"small"}
                    style={cssStyle(
                      "padding:.4rem 0;border-bottom:1px dashed var(--line)",
                    )}
                  >
                    <b>{row14.v15}</b>
                    {row14.choice16 === 0 ? (
                      <>
                        {" · "}
                        {row14.v17}
                      </>
                    ) : null}
                    <br />
                    <span className={"muted"}>
                      {row14.v18}
                      {" · "}
                      {row14.rows19?.length ? (
                        row14.rows19.map((row19, index) => (
                          <Fragment key={index}>
                            {row19.v20}
                            {" × "}
                            {row19.v21}
                            {row19.choice22 === 0 ? <>{", "}</> : null}
                          </Fragment>
                        ))
                      ) : (
                        <></>
                      )}
                    </span>
                  </div>
                </Fragment>
              ))
            ) : (
              <>
                <div className={"muted small"}>{"None yet."}</div>
              </>
            )}
          </div>
        </div>
        {"\n"}
      </div>
      {"\n"}
    </>
  );
}
