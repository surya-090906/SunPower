// Native React page. Data contract: backoffice/customer360.
import { Fragment, cssStyle, text, ActionForm, CsrfField } from "@ui/runtime";
export default function Page({ data, state }) {
  return (
    <>
      {"\n"}
      <div className={"page-head"}>
        <div>
          <a className={"small"} href={"/app/help/"}>
            {"‹ Helpdesk"}
          </a>
          <h1 style={cssStyle("margin-top:.3rem")}>{data.v1}</h1>
          {"\n  "}
          <div className={"sub"}>
            <a href={"tel:" + text(data.v2)}>{data.v3}</a>
            {data.choice4 === 0 ? (
              <>
                {" · "}
                {data.v5}
              </>
            ) : null}
            {" · "}
            {data.v6}
          </div>
        </div>
        {"\n  "}
        <div className={"row"}>
          {data.choice7 === 0 ? (
            <>
              <span className={"badge b-green"}>{"Portal login"}</span>
            </>
          ) : data.choice7 === 1 ? (
            <>
              <span className={"badge b-grey"}>{"No portal login"}</span>
            </>
          ) : null}
          {data.choice8 === 0 ? (
            <>
              <span className={"badge b-amber"}>
                {"Balance due "}
                {data.v9}
              </span>
            </>
          ) : null}
        </div>
      </div>
      {"\n"}
      <div className={"grid g-main"}>
        {"\n  "}
        <div className={"stack"}>
          {"\n    "}
          <div className={"card"}>
            <div className={"card-h"}>
              <h2>{"Installed units"}</h2>
              <span className={"muted small"}>
                {"Tap Open ticket on the unit with the fault"}
              </span>
            </div>
            <div className={"card-b tight tbl-wrap"}>
              <table className={"table"}>
                <thead>
                  <tr>
                    <th>{"Item"}</th>
                    <th>{"Serial"}</th>
                    <th>{"Warranty"}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows10?.length ? (
                    data.rows10.map((row10, index) => (
                      <Fragment key={index}>
                        <tr>
                          <td>
                            {row10.v11}
                            <div className={"tiny faint"}>
                              {row10.v12}
                              {" · delivered "}
                              {row10.v13}
                            </div>
                          </td>
                          <td className={"mono small"}>
                            <a
                              href={
                                "/app/inventory/serials/" +
                                text(row10.v14) +
                                "/"
                              }
                            >
                              {row10.v15}
                            </a>
                          </td>
                          <td>
                            <span className={"badge " + text(row10.v16)}>
                              {row10.v17}
                            </span>
                            {row10.choice18 === 0 ? (
                              <>
                                <div className={"tiny faint"}>
                                  {"until "}
                                  {row10.v19}
                                </div>
                              </>
                            ) : null}
                          </td>
                          <td className={"right"}>
                            {row10.choice20 === 0 ? (
                              <>
                                <a
                                  className={"btn btn-dark btn-sm"}
                                  href={
                                    "/app/help/ticket/new/?customer=" +
                                    text(row10.v21) +
                                    "&serial=" +
                                    text(row10.v22)
                                  }
                                >
                                  {"Open ticket"}
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
                        <td colSpan={"4"} className={"empty"}>
                          {"No delivered equipment yet."}
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
              <h2>{"Tickets"}</h2>
            </div>
            <div className={"card-b tight tbl-wrap"}>
              <table className={"table"}>
                <tbody>
                  {data.rows23?.length ? (
                    data.rows23.map((row23, index) => (
                      <Fragment key={index}>
                        <tr>
                          <td>
                            <a
                              className={"mono"}
                              href={
                                "/app/help/tickets/" + text(row23.v24) + "/"
                              }
                            >
                              {row23.v25}
                            </a>
                          </td>
                          <td>{row23.v26}</td>
                          <td className={"small"}>{row23.v27}</td>
                          <td>
                            {row23.choice28 === 0 ? (
                              <>
                                <span className={"badge b-green"}>
                                  {"Warranty"}
                                </span>
                              </>
                            ) : row23.choice28 === 1 ? (
                              <>
                                <span className={"badge b-red"}>
                                  {"Billable"}
                                </span>
                              </>
                            ) : null}
                          </td>
                          <td>
                            <span className={"badge " + text(row23.v29)}>
                              {row23.v30}
                            </span>
                          </td>
                          <td className={"small muted"}>{row23.v31}</td>
                        </tr>
                      </Fragment>
                    ))
                  ) : (
                    <>
                      <tr>
                        <td className={"empty"}>{"No tickets."}</td>
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
        <div className={"stack"}>
          {"\n    "}
          <div className={"card"}>
            <div className={"card-h"}>
              <h2>{"Projects"}</h2>
            </div>
            <div className={"card-b tight"}>
              {data.rows32?.length ? (
                data.rows32.map((row32, index) => (
                  <Fragment key={index}>
                    <a
                      className={"spread"}
                      href={"/app/p/" + text(row32.v33) + "/"}
                      style={cssStyle(
                        "padding:.75rem 1.1rem;border-bottom:1px solid var(--line);color:inherit",
                      )}
                    >
                      <span>
                        <b className={"mono"}>{row32.v34}</b>
                        <br />
                        <span className={"small muted"}>{row32.v35}</span>
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
          {"\n    "}
          {data.choice38 === 0 ? (
            <>
              <div className={"card"}>
                <div className={"card-b"}>
                  <p className={"small muted"}>
                    {"This customer has no portal login yet."}
                  </p>
                  {data.choice39 === 0 ? (
                    <>
                      <ActionForm
                        method={"post"}
                        action={"/app/p/" + text(data.v40) + "/do/invite/"}
                      >
                        <CsrfField />
                        <button className={"btn btn-line btn-block"}>
                          {"Send portal invitation"}
                        </button>
                      </ActionForm>
                    </>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}
          {"\n    "}
          <div className={"card"}>
            <div className={"card-h"}>
              <h2>{"Recent messages"}</h2>
            </div>
            <div className={"card-b stack"}>
              {data.rows41?.length ? (
                data.rows41.map((row41, index) => (
                  <Fragment key={index}>
                    <div className={"small"}>
                      <span className={"muted"}>{row41.v42}</span> {row41.v43}
                      {row41.choice44 === 0 ? (
                        <>
                          {" "}
                          <a
                            href={text(row41.v45)}
                            target={"_blank"}
                            rel={"noopener"}
                          >
                            {"WhatsApp ›"}
                          </a>
                        </>
                      ) : null}
                    </div>
                  </Fragment>
                ))
              ) : (
                <>
                  <span className={"muted small"}>{"None."}</span>
                </>
              )}
            </div>
          </div>
          {"\n  "}
        </div>
        {"\n"}
      </div>
      {"\n"}
    </>
  );
}
