// Native React page. Data contract: backoffice/help.
import { Fragment, cssStyle, text, Field, ActionForm } from "@ui/runtime";
export default function Page({ data, state }) {
  return (
    <>
      {"\n"}
      <div className={"page-head"}>
        <div>
          <h1>{"Helpdesk"}</h1>
          <div className={"sub"}>
            {
              "Find the customer and the exact unit in seconds, and see at once whether it is under warranty."
            }
          </div>
        </div>
      </div>
      {"\n"}
      <ActionForm method={"get"} className={"mb"}>
        <Field
          className={"inp"}
          style={cssStyle("font-size:1.15rem;padding:.85rem 1rem")}
          name={"q"}
          value={text(data.v1)}
          placeholder={
            "Type a phone number, name, serial number, project or ticket code"
          }
          autoFocus={true}
        />
      </ActionForm>
      {"\n"}
      {data.choice2 === 0 ? (
        <>
          {"\n"}
          <div className={"stack"}>
            {"\n  "}
            {data.choice3 === 0 ? (
              <>
                <div className={"card"}>
                  <div className={"card-h"}>
                    <h2>{"Units"}</h2>
                  </div>
                  <div className={"card-b tight"}>
                    {"\n    "}
                    {data.rows4?.length ? (
                      data.rows4.map((row4, index) => (
                        <Fragment key={index}>
                          <div
                            className={"spread"}
                            style={cssStyle(
                              "padding:.85rem 1.1rem;border-bottom:1px solid var(--line)",
                            )}
                          >
                            <div>
                              <b>{row4.v5}</b>{" "}
                              <span className={"mono small"}>{row4.v6}</span>
                              <div className={"small muted"}>
                                {row4.choice7 === 0 ? (
                                  <>
                                    {row4.v8}
                                    {" · "}
                                    {row4.v9}
                                  </>
                                ) : row4.choice7 === 1 ? (
                                  <>
                                    {"Not sold yet ("}
                                    {row4.v10}
                                    {")"}
                                  </>
                                ) : null}
                              </div>
                            </div>
                            {"\n      "}
                            <div className={"row"}>
                              <span
                                className={"badge " + text(row4.v11)}
                                style={cssStyle(
                                  "font-size:.84rem;padding:.25rem .7rem",
                                )}
                              >
                                {row4.v12}
                              </span>
                              {row4.choice13 === 0 ? (
                                <>
                                  <a
                                    className={"btn btn-dark btn-sm"}
                                    href={
                                      "/app/help/ticket/new/?customer=" +
                                      text(row4.v14) +
                                      "&serial=" +
                                      text(row4.v15)
                                    }
                                  >
                                    {"Open ticket"}
                                  </a>
                                </>
                              ) : null}
                              <a
                                className={"btn btn-line btn-sm"}
                                href={
                                  "/app/inventory/serials/" +
                                  text(row4.v16) +
                                  "/"
                                }
                              >
                                {"History"}
                              </a>
                            </div>
                          </div>
                        </Fragment>
                      ))
                    ) : (
                      <></>
                    )}
                  </div>
                </div>
              </>
            ) : null}
            {"\n  "}
            {data.choice17 === 0 ? (
              <>
                <div className={"card"}>
                  <div className={"card-h"}>
                    <h2>{"Customers"}</h2>
                  </div>
                  <div className={"card-b tight"}>
                    {"\n    "}
                    {data.rows18?.length ? (
                      data.rows18.map((row18, index) => (
                        <Fragment key={index}>
                          <a
                            className={"spread"}
                            href={"/app/help/customer/" + text(row18.v19) + "/"}
                            style={cssStyle(
                              "padding:.85rem 1.1rem;border-bottom:1px solid var(--line);color:inherit",
                            )}
                          >
                            <div>
                              <b>{row18.v20}</b>
                              <div className={"small muted"}>
                                {row18.v21}
                                {" · "}
                                {row18.v22}
                              </div>
                            </div>
                            <span className={"btn btn-line btn-sm"}>
                              {"Open"}
                            </span>
                          </a>
                        </Fragment>
                      ))
                    ) : (
                      <></>
                    )}
                  </div>
                </div>
              </>
            ) : null}
            {"\n  "}
            {data.choice23 === 0 ? (
              <>
                <div className={"card"}>
                  <div className={"card-h"}>
                    <h2>{"Projects"}</h2>
                  </div>
                  <div className={"card-b tight"}>
                    {data.rows24?.length ? (
                      data.rows24.map((row24, index) => (
                        <Fragment key={index}>
                          <a
                            className={"spread"}
                            href={"/app/p/" + text(row24.v25) + "/"}
                            style={cssStyle(
                              "padding:.7rem 1.1rem;border-bottom:1px solid var(--line);color:inherit",
                            )}
                          >
                            <span>
                              <b className={"mono"}>{row24.v26}</b> {row24.v27}
                              {" · "}
                              {row24.v28}
                            </span>
                            <span className={"badge " + text(row24.v29)}>
                              {row24.v30}
                            </span>
                          </a>
                        </Fragment>
                      ))
                    ) : (
                      <></>
                    )}
                  </div>
                </div>
              </>
            ) : null}
            {"\n  "}
            {data.choice31 === 0 ? (
              <>
                <div className={"card"}>
                  <div className={"card-h"}>
                    <h2>{"Tickets"}</h2>
                  </div>
                  <div className={"card-b tight"}>
                    {data.rows32?.length ? (
                      data.rows32.map((row32, index) => (
                        <Fragment key={index}>
                          <a
                            className={"spread"}
                            href={"/app/help/tickets/" + text(row32.v33) + "/"}
                            style={cssStyle(
                              "padding:.7rem 1.1rem;border-bottom:1px solid var(--line);color:inherit",
                            )}
                          >
                            <span>
                              <b className={"mono"}>{row32.v34}</b> {row32.v35}
                            </span>
                            <span className={"badge " + text(row32.v36)}>
                              {row32.v37}
                            </span>
                          </a>
                        </Fragment>
                      ))
                    ) : (
                      <></>
                    )}
                  </div>
                </div>
              </>
            ) : null}
            {"\n  "}
            {data.choice38 === 0 ? (
              <>
                <div className={"card"}>
                  <div className={"empty"}>
                    {'No match for "'}
                    {data.v39}
                    {
                      '". Try the last 4 digits of the phone number, or part of the serial number.'
                    }
                  </div>
                </div>
              </>
            ) : null}
            {"\n"}
          </div>
          {"\n"}
        </>
      ) : data.choice2 === 1 ? (
        <>
          {"\n"}
          <div className={"card"}>
            <div className={"card-h"}>
              <h2>{"Open tickets"}</h2>
              <a className={"small"} href={"/app/help/tickets/"}>
                {"All tickets"}
              </a>
            </div>
            <div className={"card-b tight tbl-wrap"}>
              <table className={"table"}>
                <tbody>
                  {data.rows40?.length ? (
                    data.rows40.map((row40, index) => (
                      <Fragment key={index}>
                        <tr>
                          <td>
                            <a
                              className={"mono"}
                              href={
                                "/app/help/tickets/" + text(row40.v41) + "/"
                              }
                            >
                              {row40.v42}
                            </a>
                          </td>
                          <td>{row40.v43}</td>
                          <td className={"small"}>{row40.v44}</td>
                          <td>
                            {row40.choice45 === 0 ? (
                              <>
                                <span className={"badge b-green"}>
                                  {"Warranty"}
                                </span>
                              </>
                            ) : row40.choice45 === 1 ? (
                              <>
                                <span className={"badge b-red"}>
                                  {"Billable"}
                                </span>
                              </>
                            ) : null}
                          </td>
                          <td>
                            <span className={"badge " + text(row40.v46)}>
                              {row40.v47}
                            </span>
                          </td>
                          <td className={"small muted"}>{row40.v48}</td>
                        </tr>
                      </Fragment>
                    ))
                  ) : (
                    <>
                      <tr>
                        <td className={"empty"}>{"No open tickets."}</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {"\n"}
        </>
      ) : null}
      {"\n"}
    </>
  );
}
