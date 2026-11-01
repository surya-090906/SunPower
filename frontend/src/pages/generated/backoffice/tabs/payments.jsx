// Native React page. Data contract: backoffice/tabs/payments.
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
      <div className={"grid g4 mb"}>
        {"\n  "}
        <div className={"card kpi"}>
          <div className={"label"}>{"Quote total (incl. GST)"}</div>
          <div className={"val"}>{data.v1}</div>
        </div>
        {"\n  "}
        <div className={"card kpi"}>
          <div className={"label"}>
            {"Advance to confirm ("}
            {data.v2}
            {")"}
          </div>
          <div className={"val"}>{data.v3}</div>
          <div className={"small muted"}>{"still needed"}</div>
        </div>
        {"\n  "}
        <div className={"card kpi"}>
          <div className={"label"}>{"Paid (confirmed)"}</div>
          <div className={"val"}>{data.v4}</div>
        </div>
        {"\n  "}
        <div className={"card kpi"}>
          <div className={"label"}>{"Balance due"}</div>
          <div className={"val"}>{data.v5}</div>
        </div>
        {"\n"}
      </div>
      {"\n"}
      <div className={"grid g-main"}>
        {"\n  "}
        <div className={"stack"}>
          {"\n    "}
          <div className={"card"}>
            <div className={"card-h"}>
              <h2>{"Payments"}</h2>
            </div>
            <div className={"card-b tight tbl-wrap"}>
              <table className={"table"}>
                <thead>
                  <tr>
                    <th>{"Date"}</th>
                    <th>{"Method"}</th>
                    <th>{"Reference"}</th>
                    <th className={"num"}>{"Amount"}</th>
                    <th>{"Status"}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows6?.length ? (
                    data.rows6.map((row6, index) => (
                      <Fragment key={index}>
                        <tr>
                          <td className={"nowrap"}>{row6.v7}</td>
                          <td>{row6.v8}</td>
                          <td className={"small mono"}>{row6.v9}</td>
                          <td className={"num"}>{row6.v10}</td>
                          <td>
                            <span className={"badge " + text(row6.v11)}>
                              {row6.v12}
                            </span>
                            {row6.choice13 === 0 ? (
                              <>
                                {" "}
                                <span className={"tiny faint"}>
                                  {"by customer"}
                                </span>
                              </>
                            ) : null}
                          </td>
                          <td className={"nowrap"}>
                            {row6.choice14 === 0 ? (
                              <>
                                <ActionForm
                                  method={"post"}
                                  action={
                                    "/app/p/" +
                                    text(row6.v15) +
                                    "/do/payment_verify/"
                                  }
                                  className={"row"}
                                  style={cssStyle("gap:.3rem")}
                                >
                                  <CsrfField />
                                  <Field
                                    type={"hidden"}
                                    name={"payment"}
                                    value={text(row6.v16)}
                                  />
                                  <button
                                    className={"btn btn-ok btn-sm"}
                                    name={"decision"}
                                    value={"approve"}
                                  >
                                    {"Verify"}
                                  </button>
                                  <button
                                    className={"btn btn-danger btn-sm"}
                                    name={"decision"}
                                    value={"reject"}
                                  >
                                    {"Reject"}
                                  </button>
                                </ActionForm>
                              </>
                            ) : row6.choice14 === 1 ? (
                              <>
                                <a
                                  className={"small"}
                                  href={"/doc/receipt/" + text(row6.v17) + "/"}
                                >
                                  {"Receipt"}
                                </a>
                              </>
                            ) : null}
                          </td>
                        </tr>
                      </Fragment>
                    ))
                  ) : (
                    <>
                      <tr>
                        <td colSpan={"6"} className={"empty"}>
                          {"No payments yet."}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {"\n    "}
          <div className={"card"}>
            <div className={"card-h"}>
              <h2>{"Invoices"}</h2>
            </div>
            <div className={"card-b tight tbl-wrap"}>
              <table className={"table"}>
                <thead>
                  <tr>
                    <th>{"Number"}</th>
                    <th>{"Type"}</th>
                    <th>{"Issued"}</th>
                    <th className={"num"}>{"Total"}</th>
                    <th className={"num"}>{"Balance"}</th>
                    <th>{"Status"}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows18?.length ? (
                    data.rows18.map((row18, index) => (
                      <Fragment key={index}>
                        <tr>
                          <td className={"mono"}>{row18.v19}</td>
                          <td>{row18.v20}</td>
                          <td>{row18.v21}</td>
                          <td className={"num"}>{row18.v22}</td>
                          <td className={"num"}>{row18.v23}</td>
                          <td>
                            <span className={"badge " + text(row18.v24)}>
                              {row18.v25}
                            </span>
                          </td>
                          <td>
                            <a
                              className={"small"}
                              href={"/doc/invoice/" + text(row18.v26) + "/"}
                            >
                              {"Open"}
                            </a>
                          </td>
                        </tr>
                      </Fragment>
                    ))
                  ) : (
                    <>
                      <tr>
                        <td colSpan={"7"} className={"empty"}>
                          {
                            "The final invoice is created automatically when the install is signed off."
                          }
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {"\n  "}
        </div>
        {"\n  "}
        <div className={"card"}>
          <div className={"card-h"}>
            <h2>{"Record a payment"}</h2>
          </div>
          <div className={"card-b"}>
            {"\n    "}
            {data.choice27 === 0 ? (
              <>
                <p className={"muted small"}>
                  {"Only Accounts and Sales record payments."}
                </p>
                {"\n    "}
              </>
            ) : data.choice27 === 1 ? (
              <>
                <div className={"gate"}>
                  {"No accepted quote yet, so there is nothing to pay against."}
                </div>
                {"\n    "}
              </>
            ) : data.choice27 === 2 ? (
              <>
                <div className={"banner ok"}>
                  <span className={"ico"}>{"✓"}</span>
                  <div>{"Fully paid."}</div>
                </div>
                {"\n    "}
              </>
            ) : data.choice27 === 3 ? (
              <>
                {"\n    "}
                <ActionForm
                  method={"post"}
                  action={"/app/p/" + text(data.v28) + "/do/payment_record/"}
                  className={"stack"}
                >
                  <CsrfField />
                  {"\n      "}
                  <FieldGroup className={"field"}>
                    <label>{"Amount (₹)"}</label>
                    <Field
                      className={"inp"}
                      name={"amount"}
                      value={text(data.v29)}
                      inputMode={"numeric"}
                      required={true}
                    />
                  </FieldGroup>
                  {"\n      "}
                  <FieldGroup className={"field"}>
                    <label>{"Method"}</label>
                    <SelectField className={"inp"} name={"method"}>
                      <option value={"upi"}>{"UPI"}</option>
                      <option value={"bank"}>{"Bank transfer"}</option>
                      <option value={"cash"}>{"Cash"}</option>
                      <option value={"cheque"}>{"Cheque"}</option>
                    </SelectField>
                  </FieldGroup>
                  {"\n      "}
                  <FieldGroup className={"field"}>
                    <label>
                      {"Reference "}
                      <span className={"faint"}>{"(UTR or cheque no.)"}</span>
                    </label>
                    <Field className={"inp"} name={"reference"} />
                  </FieldGroup>
                  {"\n      "}
                  <button className={"btn btn-primary btn-block"}>
                    {"Record payment"}
                  </button>
                  {"\n      "}
                  {data.choice30 === 0 ? (
                    <>
                      <p className={"hint"}>
                        {"An advance of "}
                        {data.v31}
                        {
                          " more confirms the order and creates the pick list and the install slot."
                        }
                      </p>
                    </>
                  ) : null}
                  {"\n    "}
                </ActionForm>
              </>
            ) : null}
            {"\n  "}
          </div>
        </div>
        {"\n"}
      </div>
      {"\n"}
    </>
  );
}
