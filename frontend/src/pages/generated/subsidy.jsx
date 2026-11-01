// Native React page. Data contract: backoffice/tabs/subsidy.
import {
  Fragment,
  cssStyle,
  text,
  Field,
  ActionForm,
  CsrfField,
} from "@ui/runtime";
export default function Page({ data, state }) {
  return (
    <>
      {data.choice1 === 0 ? (
        <>
          <div className={"card mb"}>
            <div className={"card-h"}>
              <h2>{"Follow-ups"}</h2>
            </div>
            <div className={"card-b tight tbl-wrap"}>
              <table className={"table"}>
                <tbody>
                  {data.rows2?.length ? (
                    data.rows2.map((row2, index) => (
                      <Fragment key={index}>
                        <tr>
                          <td>{row2.v3}</td>
                          <td className={"small muted"}>{row2.v4}</td>
                          <td className={"small"}>
                            {row2.choice5 === 0 ? (
                              <>
                                {row2.choice6 === 0 ? (
                                  <>
                                    <span className={"badge b-red"}>
                                      {"overdue"}
                                    </span>{" "}
                                  </>
                                ) : null}
                                {row2.v7}
                              </>
                            ) : null}
                          </td>
                          <td>
                            <span className={"badge " + text(row2.v8)}>
                              {row2.v9}
                            </span>
                          </td>
                          <td className={"right"}>
                            {row2.choice10 === 0 ? (
                              <>
                                <ActionForm
                                  method={"post"}
                                  action={
                                    "/app/p/" +
                                    text(row2.v11) +
                                    "/do/task_done/"
                                  }
                                  className={"inline-form"}
                                >
                                  <CsrfField />
                                  <Field
                                    type={"hidden"}
                                    name={"task"}
                                    value={text(row2.v12)}
                                  />
                                  <button className={"btn btn-ok btn-sm"}>
                                    {"Done"}
                                  </button>
                                </ActionForm>
                              </>
                            ) : null}
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
        </>
      ) : null}
      {"\n"}
      <div className={"card"}>
        <div className={"card-h"}>
          <h2>{"Government subsidy paperwork"}</h2>
          {data.choice13 === 0 ? (
            <>
              <span className={"muted small"}>
                {data.v14}
                {" steps"}
              </span>
            </>
          ) : null}
        </div>
        <div className={"card-b tight tbl-wrap"}>
          {"\n  "}
          {data.choice15 === 0 ? (
            <>
              <table className={"table"}>
                <tbody>
                  {data.rows16?.length ? (
                    data.rows16.map((row16, index) => (
                      <Fragment key={index}>
                        <tr>
                          <td className={"mono"}>{row16.v17}</td>
                          <td>{row16.v18}</td>
                          <td className={"small"}>
                            {row16.choice19 === 0 ? (
                              <>{row16.v20}</>
                            ) : row16.choice19 === 1 ? (
                              <>
                                {row16.choice21 === 0 ? (
                                  <>
                                    <span className={"badge b-red"}>
                                      {"overdue"}
                                    </span>{" "}
                                  </>
                                ) : null}
                                {"due "}
                                {row16.v22}
                              </>
                            ) : null}
                          </td>
                          <td>
                            <span className={"badge " + text(row16.v23)}>
                              {row16.v24}
                            </span>
                          </td>
                          <td className={"right nowrap"}>
                            {row16.choice25 === 0 ? (
                              <>
                                <ActionForm
                                  method={"post"}
                                  action={
                                    "/app/p/" +
                                    text(row16.v26) +
                                    "/do/task_done/"
                                  }
                                  className={"row"}
                                  style={cssStyle(
                                    "gap:.3rem;justify-content:flex-end",
                                  )}
                                >
                                  <CsrfField />
                                  <Field
                                    type={"hidden"}
                                    name={"task"}
                                    value={text(row16.v27)}
                                  />
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
                    <></>
                  )}
                </tbody>
              </table>
              {"\n  "}
            </>
          ) : data.choice15 === 1 ? (
            <>
              <div className={"empty"}>
                {data.choice28 === 0 ? (
                  <>{"The checklist is created when the order is confirmed."}</>
                ) : data.choice28 === 1 ? (
                  <>{"No subsidy for this project."}</>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      </div>
      {"\n"}
    </>
  );
}
