// Native React page. Data contract: backoffice/accounts.
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
      <div className={"page-head"}>
        <div>
          <h1>{"Accounting"}</h1>
          <div className={"sub"}>
            {
              "Verify payments, chase invoices, track the subsidy paperwork and pay the technicians."
            }
          </div>
        </div>
      </div>
      {"\n"}
      <div className={"tabs"}>
        {data.rows1?.length ? (
          data.rows1.map((row1, index) => (
            <Fragment key={index}>
              <a
                href={"?tab=" + text(row1.v2)}
                className={row1.choice3 === 0 ? "active" : ""}
              >
                {row1.v4}
                {row1.choice5 === 0 ? (
                  <>
                    <span className={"badge b-amber count"}>{row1.v6}</span>
                  </>
                ) : null}
              </a>
            </Fragment>
          ))
        ) : (
          <></>
        )}
      </div>
      {"\n\n"}
      {data.choice7 === 0 ? (
        <>
          {"\n"}
          <div className={"card mb"}>
            <div className={"card-h"}>
              <h2>{"Waiting for verification"}</h2>
              <span className={"small muted"}>
                {
                  "References submitted by customers. The order confirms once you verify."
                }
              </span>
            </div>
            <div className={"card-b tight tbl-wrap"}>
              <table className={"table"}>
                <thead>
                  <tr>
                    <th>{"Customer"}</th>
                    <th>{"Project"}</th>
                    <th>{"Method"}</th>
                    <th>{"Reference"}</th>
                    <th className={"num"}>{"Amount"}</th>
                    <th>{"Submitted"}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows8?.length ? (
                    data.rows8.map((row8, index) => (
                      <Fragment key={index}>
                        <tr>
                          <td>{row8.v9}</td>
                          <td>
                            <a
                              className={"mono"}
                              href={
                                "/app/p/" + text(row8.v10) + "/?tab=payments"
                              }
                            >
                              {row8.v11}
                            </a>
                          </td>
                          <td>{row8.v12}</td>
                          <td className={"mono small"}>{row8.v13}</td>
                          <td className={"num"}>{row8.v14}</td>
                          <td className={"small muted"}>{row8.v15}</td>
                          <td className={"right nowrap"}>
                            <ActionForm
                              method={"post"}
                              action={
                                "/app/accounts/verify/" + text(row8.v16) + "/"
                              }
                              className={"row"}
                              style={cssStyle(
                                "gap:.3rem;justify-content:flex-end",
                              )}
                            >
                              <CsrfField />
                              <Field
                                className={"inp"}
                                name={"note"}
                                placeholder={"Note if rejecting"}
                                style={cssStyle("width:150px")}
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
                          </td>
                        </tr>
                      </Fragment>
                    ))
                  ) : (
                    <>
                      <tr>
                        <td colSpan={"7"} className={"empty"}>
                          {"Nothing to verify."}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {"\n"}
          <div className={"card"}>
            <div className={"card-h"}>
              <h2>{"Recent payments"}</h2>
            </div>
            <div className={"card-b tight tbl-wrap"}>
              <table className={"table"}>
                <tbody>
                  {data.rows17?.length ? (
                    data.rows17.map((row17, index) => (
                      <Fragment key={index}>
                        <tr>
                          <td className={"small muted nowrap"}>{row17.v18}</td>
                          <td>{row17.v19}</td>
                          <td className={"small"}>
                            {row17.v20}
                            {" · "}
                            {row17.v21}
                          </td>
                          <td className={"num"}>{row17.v22}</td>
                          <td>
                            <a
                              className={"small"}
                              href={"/doc/receipt/" + text(row17.v23) + "/"}
                            >
                              {"Receipt"}
                            </a>
                          </td>
                        </tr>
                      </Fragment>
                    ))
                  ) : (
                    <></>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {"\n\n"}
        </>
      ) : data.choice7 === 1 ? (
        <>
          {"\n"}
          <div className={"card mb"}>
            <div className={"card-h"}>
              <h2>{"Open invoices"}</h2>
              <span className={"small muted"}>
                {"Balance still to collect"}
              </span>
            </div>
            <div className={"card-b tight tbl-wrap"}>
              <table className={"table"}>
                <thead>
                  <tr>
                    <th>{"Invoice"}</th>
                    <th>{"Customer"}</th>
                    <th>{"Type"}</th>
                    <th>{"Due"}</th>
                    <th className={"num"}>{"Total"}</th>
                    <th className={"num"}>{"Balance"}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows24?.length ? (
                    data.rows24.map((row24, index) => (
                      <Fragment key={index}>
                        <tr>
                          <td className={"mono"}>{row24.v25}</td>
                          <td>{row24.v26}</td>
                          <td>{row24.v27}</td>
                          <td className={"small"}>
                            {row24.v28}
                            {row24.choice29 === 0 ? (
                              <>
                                {" "}
                                <span className={"badge b-red"}>{"late"}</span>
                              </>
                            ) : null}
                          </td>
                          <td className={"num"}>{row24.v30}</td>
                          <td className={"num bold"}>{row24.v31}</td>
                          <td className={"nowrap"}>
                            <a
                              className={"small"}
                              href={"/doc/invoice/" + text(row24.v32) + "/"}
                            >
                              {"Open"}
                            </a>
                            {" · "}
                            <a
                              className={"small"}
                              href={
                                "/app/p/" + text(row24.v33) + "/?tab=payments"
                              }
                            >
                              {"Record payment"}
                            </a>
                          </td>
                        </tr>
                      </Fragment>
                    ))
                  ) : (
                    <>
                      <tr>
                        <td colSpan={"7"} className={"empty"}>
                          {"All invoices are paid."}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {"\n"}
          <div className={"card"}>
            <div className={"card-h"}>
              <h2>{"Recently paid"}</h2>
            </div>
            <div className={"card-b tight tbl-wrap"}>
              <table className={"table"}>
                <tbody>
                  {data.rows34?.length ? (
                    data.rows34.map((row34, index) => (
                      <Fragment key={index}>
                        <tr>
                          <td className={"mono"}>{row34.v35}</td>
                          <td>{row34.v36}</td>
                          <td className={"num"}>{row34.v37}</td>
                          <td>
                            <span className={"badge b-green"}>{"Paid"}</span>
                          </td>
                        </tr>
                      </Fragment>
                    ))
                  ) : (
                    <></>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {"\n\n"}
        </>
      ) : data.choice7 === 2 ? (
        <>
          {"\n"}
          <div className={"card"}>
            <div className={"card-h"}>
              <h2>{"Subsidy paperwork still open"}</h2>
              <span className={"small muted"}>
                {"Steps wait on the customer, the electricity board or us"}
              </span>
            </div>
            <div className={"card-b tight tbl-wrap"}>
              <table className={"table"}>
                <thead>
                  <tr>
                    <th>{"Customer"}</th>
                    <th>{"Step"}</th>
                    <th>{"Status"}</th>
                    <th>{"Waiting"}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows38?.length ? (
                    data.rows38.map((row38, index) => (
                      <Fragment key={index}>
                        <tr>
                          <td>
                            <a
                              href={
                                "/app/p/" + text(row38.v39) + "/?tab=subsidy"
                              }
                            >
                              {row38.v40}
                            </a>
                            <div className={"tiny faint"}>{row38.v41}</div>
                          </td>
                          <td>
                            {row38.v42}
                            {". "}
                            {row38.v43}
                          </td>
                          <td>
                            <span className={"badge " + text(row38.v44)}>
                              {row38.v45}
                            </span>
                          </td>
                          <td>
                            {row38.choice46 === 0 ? (
                              <>
                                {row38.choice47 === 0 ? (
                                  <>
                                    <span className={"badge b-red"}>
                                      {row38.v48}
                                      {" days"}
                                    </span>
                                  </>
                                ) : row38.choice47 === 1 ? (
                                  <>
                                    {row38.v49}
                                    {" d"}
                                  </>
                                ) : null}
                              </>
                            ) : null}
                          </td>
                          <td className={"right nowrap"}>
                            {row38.choice50 === 0 ? (
                              <>
                                <ActionForm
                                  method={"post"}
                                  action={
                                    "/app/accounts/task/" +
                                    text(row38.v51) +
                                    "/done/"
                                  }
                                  className={"row"}
                                  style={cssStyle(
                                    "gap:.3rem;justify-content:flex-end",
                                  )}
                                >
                                  <CsrfField />
                                  <button className={"btn btn-ok btn-sm"}>
                                    {"Done"}
                                  </button>
                                  <button
                                    className={"btn btn-line btn-sm"}
                                    name={"na"}
                                    value={"1"}
                                  >
                                    {"N/A"}
                                  </button>
                                </ActionForm>
                              </>
                            ) : null}
                          </td>
                        </tr>
                      </Fragment>
                    ))
                  ) : (
                    <>
                      <tr>
                        <td colSpan={"5"} className={"empty"}>
                          {"No subsidy steps open."}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {"\n\n"}
        </>
      ) : data.choice7 === 3 ? (
        <>
          {"\n"}
          <div className={"spread mb"}>
            <ActionForm method={"get"} className={"row"}>
              <Field type={"hidden"} name={"tab"} value={"payroll"} />
              <label className={"small bold"}>{"Month"}</label>
              <Field
                className={"inp"}
                style={cssStyle("width:auto")}
                type={"month"}
                name={"month"}
                value={text(data.v52)}
                data-autosubmit={true}
              />
            </ActionForm>
            {"\n  "}
            <a
              className={"btn btn-line"}
              href={"/app/accounts/payroll.csv?month=" + text(data.v53)}
            >
              {"Download CSV"}
            </a>
          </div>
          {"\n"}
          <div className={"card"}>
            <div className={"card-h"}>
              <h2>
                {"Technician pay for "}
                {data.v54}
              </h2>
              <span className={"bold"}>
                {data.v55}
                {" · "}
                {data.v56}
                {" h"}
              </span>
            </div>
            <div className={"card-b tight tbl-wrap"}>
              <table className={"table"}>
                <thead>
                  <tr>
                    <th>{"Technician"}</th>
                    <th className={"num"}>{"Installs"}</th>
                    <th className={"num"}>{"Install hours"}</th>
                    <th className={"num"}>{"Service hours"}</th>
                    <th className={"num"}>{"Rate / h"}</th>
                    <th className={"num"}>{"Amount"}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows57?.length ? (
                    data.rows57.map((row57, index) => (
                      <Fragment key={index}>
                        <tr>
                          <td>{row57.v58}</td>
                          <td className={"num"}>{row57.v59}</td>
                          <td className={"num"}>{row57.v60}</td>
                          <td className={"num"}>{row57.v61}</td>
                          <td className={"num"}>{row57.v62}</td>
                          <td className={"num bold"}>{row57.v63}</td>
                        </tr>
                      </Fragment>
                    ))
                  ) : (
                    <></>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {"\n"}
          <p className={"hint mt-s"}>
            {
              "Hours come straight from the install forms (start to finish, for each technician marked present) and the labour logged on service tickets."
            }
          </p>
          {"\n\n"}
        </>
      ) : data.choice7 === 4 ? (
        <>
          {"\n"}
          <div className={"grid g-main"}>
            {"\n  "}
            <div className={"card"}>
              <div className={"card-h"}>
                <h2>{"Recent manual costs"}</h2>
              </div>
              <div className={"card-b tight tbl-wrap"}>
                <table className={"table"}>
                  <tbody>
                    {data.rows64?.length ? (
                      data.rows64.map((row64, index) => (
                        <Fragment key={index}>
                          <tr>
                            <td className={"small muted"}>{row64.v65}</td>
                            <td>
                              {row64.v66}
                              <div className={"tiny faint"}>{row64.v67}</div>
                            </td>
                            <td>{row64.v68}</td>
                            <td className={"num"}>{row64.v69}</td>
                          </tr>
                        </Fragment>
                      ))
                    ) : (
                      <>
                        <tr>
                          <td className={"empty"}>{"None yet."}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {"\n  "}
            <div className={"card"}>
              <div className={"card-h"}>
                <h2>{"Add a cost to a job"}</h2>
              </div>
              <div className={"card-b"}>
                <ActionForm
                  method={"post"}
                  action={"/app/accounts/cost/"}
                  className={"stack"}
                >
                  <CsrfField />
                  {"\n    "}
                  <FieldGroup className={"field"}>
                    <label>{"Project"}</label>
                    <SelectField
                      className={"inp"}
                      name={"project"}
                      required={true}
                    >
                      <option value={""}>{"Choose…"}</option>
                      {data.rows70?.length ? (
                        data.rows70.map((row70, index) => (
                          <Fragment key={index}>
                            <option value={text(row70.v71)}>
                              {row70.v72}
                              {" · "}
                              {row70.v73}
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
                    <label>{"Amount (₹)"}</label>
                    <Field
                      className={"inp"}
                      name={"amount"}
                      inputMode={"numeric"}
                      required={true}
                    />
                  </FieldGroup>
                  {"\n    "}
                  <FieldGroup className={"field"}>
                    <label>{"What was it for?"}</label>
                    <Field
                      className={"inp"}
                      name={"note"}
                      placeholder={"Transport, permit fee, crane hire…"}
                      required={true}
                    />
                  </FieldGroup>
                  {"\n    "}
                  <button className={"btn btn-primary"}>{"Add cost"}</button>
                  <p className={"hint"}>
                    {"It lowers that job's profit on the dashboard."}
                  </p>
                </ActionForm>
              </div>
            </div>
            {"\n"}
          </div>
          {"\n"}
        </>
      ) : null}
      {"\n"}
    </>
  );
}
