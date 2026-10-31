// Native React page. Data contract: portal/pay.
import {
  Fragment,
  cssStyle,
  text,
  FieldGroup,
  Field,
  SelectField,
  ActionForm,
  CsrfField,
} from "@ui/runtime";
export default function Page({ data, state }) {
  return (
    <>
      {"\n"}
      <a className={"small"} href={"/portal/p/" + text(data.v1) + "/"}>
        {"‹ Back to project"}
      </a>
      {"\n"}
      <h1 className={"mt-s"}>{data.v2}</h1>
      {"\n"}
      <p className={"muted mb"}>
        {data.v3}
        {data.choice4 === 0 ? (
          <>
            {" · "}
            {data.v5}
          </>
        ) : null}
      </p>
      {"\n"}
      {data.choice6 === 0 ? (
        <>
          {"\n  "}
          <div className={"banner ok"}>
            <span className={"ico"}>{"✓"}</span>
            <div>
              <div className={"big"}>{"Nothing to pay right now"}</div>
              <div className={"small"}>{"Your payments are up to date."}</div>
            </div>
          </div>
          {"\n"}
        </>
      ) : data.choice6 === 1 ? (
        <>
          {"\n"}
          <div className={"pcard mb"}>
            <div className={"small muted"}>{"Amount due"}</div>
            <div
              style={cssStyle(
                "font-size:2rem;font-weight:800;letter-spacing:-.02em",
              )}
            >
              {data.v7}
            </div>
            {data.choice8 === 0 ? (
              <>
                <div className={"small muted"}>
                  {"Advance to confirm your order: "}
                  {data.v9}
                </div>
              </>
            ) : null}
          </div>
          {"\n"}
          <ActionForm method={"post"} className={"stack"}>
            <CsrfField />
            {data.choice10 === 0 ? (
              <>
                <Field
                  type={"hidden"}
                  name={"invoice"}
                  value={text(data.v11)}
                />
              </>
            ) : null}
            {"\n  "}
            {data.choice12 === 0 ? (
              <>
                <div className={"pcard"}>
                  <h3 className={"mb-s"}>{"How much to pay now?"}</h3>
                  {"\n    "}
                  {data.rows13?.length ? (
                    data.rows13.map((row13, index) => (
                      <Fragment key={index}>
                        <label
                          className={"check"}
                          style={cssStyle("padding:.4rem 0")}
                        >
                          <Field
                            type={"radio"}
                            name={"amount"}
                            value={text(row13.v14)}
                            {...(row13.attr15 === 0 ? { checked: true } : {})}
                          />
                          <span>
                            <b>{row13.v16}</b>
                            {" · "}
                            {row13.v17}
                          </span>
                        </label>
                      </Fragment>
                    ))
                  ) : (
                    <></>
                  )}
                </div>
              </>
            ) : null}
            {"\n  "}
            <div className={"pcard"}>
              <h3>{"Pay online"}</h3>
              <p className={"small muted mt-s"}>
                {
                  "Demo checkout: confirms instantly. In production this opens your bank or UPI app."
                }
              </p>
              {"\n    "}
              <button
                className={"btn btn-primary btn-lg btn-block"}
                name={"mode"}
                value={"checkout"}
              >
                {"Pay now"}
              </button>
            </div>
            {"\n  "}
            <div className={"pcard"}>
              <h3>{"Already paid by UPI or bank transfer?"}</h3>
              {"\n    "}
              <p className={"small muted mt-s"}>
                {"UPI: "}
                <b className={"mono"}>{data.v18}</b>
                <br />
                {"Bank: "}
                {data.v19}
              </p>
              {"\n    "}
              <div className={"fields mt-s"}>
                {"\n      "}
                <FieldGroup className={"field"}>
                  <label htmlFor={"m"}>{"Method"}</label>
                  <SelectField id={"m"} className={"inp"} name={"method"}>
                    <option value={"upi"}>{"UPI"}</option>
                    <option value={"bank"}>{"Bank transfer"}</option>
                    <option value={"cheque"}>{"Cheque"}</option>
                  </SelectField>
                </FieldGroup>
                {"\n      "}
                <FieldGroup className={"field"}>
                  <label htmlFor={"r"}>{"Transaction reference"}</label>
                  <Field
                    id={"r"}
                    className={"inp"}
                    name={"reference"}
                    placeholder={"UTR / cheque number"}
                  />
                </FieldGroup>
                {"\n      "}
                <FieldGroup className={"field full"}>
                  <label htmlFor={"a"}>
                    {"Amount paid (₹) "}
                    <span className={"faint"}>
                      {"leave empty for the amount selected above"}
                    </span>
                  </label>
                  <Field
                    id={"a"}
                    className={"inp"}
                    name={"custom_amount"}
                    inputMode={"numeric"}
                  />
                </FieldGroup>
                {"\n    "}
              </div>
              {"\n    "}
              <button
                className={"btn btn-dark mt-s"}
                name={"mode"}
                value={"reference"}
              >
                {"Submit payment reference"}
              </button>
              {"\n    "}
              <p className={"hint mt-s"}>
                {
                  "We verify it against our bank statement. Your order is confirmed as soon as it matches."
                }
              </p>
            </div>
            {"\n"}
          </ActionForm>
          {"\n"}
        </>
      ) : null}
      {"\n"}
      {data.choice20 === 0 ? (
        <>
          <div className={"pcard mt"}>
            <h3 className={"mb-s"}>{"Your payments"}</h3>
            {"\n  "}
            {data.rows21?.length ? (
              data.rows21.map((row21, index) => (
                <Fragment key={index}>
                  <div
                    className={"spread small"}
                    style={cssStyle("padding:.3rem 0")}
                  >
                    <span>
                      {row21.v22}
                      {" · "}
                      {row21.v23}
                      {row21.choice24 === 0 ? (
                        <>
                          {" · "}
                          {row21.v25}
                        </>
                      ) : null}
                    </span>
                    <span>
                      <b>{row21.v26}</b>{" "}
                      <span className={"badge " + text(row21.v27)}>
                        {row21.v28}
                      </span>
                    </span>
                  </div>
                </Fragment>
              ))
            ) : (
              <></>
            )}
          </div>
        </>
      ) : null}
      {"\n"}
    </>
  );
}
