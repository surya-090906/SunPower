// Native React page. Data contract: backoffice/inventory.
import { Fragment, cssStyle, text } from "@ui/runtime";
export default function Page({ data, state }) {
  return (
    <>
      {"\n"}
      <div className={"page-head"}>
        <div>
          <h1>{"Inventory"}</h1>
          <div className={"sub"}>
            {"Stock on hand, what open orders have claimed, and what to buy."}
          </div>
        </div>
        {"\n  "}
        <div className={"row"}>
          <a className={"btn btn-line"} href={"/app/inventory/serials/"}>
            {"Serial explorer"}
          </a>
          <a className={"btn btn-line"} href={"/app/inventory/dispatch/"}>
            {"Customer material bundles"}
          </a>
          {data.choice1 === 0 ? (
            <>
              <a className={"btn btn-primary"} href={"/app/inventory/receive/"}>
                {"Receive stock"}
              </a>
            </>
          ) : null}
        </div>
      </div>
      {"\n"}
      {data.choice2 === 0 ? (
        <>
          <div className={"banner bad mb"}>
            <span className={"ico"}>{"⚠"}</span>
            <div>
              <div className={"big"}>{"Short on stock for open orders"}</div>
              {"\n  "}
              <div className={"small"}>
                {data.rows3?.length ? (
                  data.rows3.map((row3, index) => (
                    <Fragment key={index}>
                      <b>{row3.v4}</b>
                      {": need "}
                      {row3.v5}
                      {", "}
                      {row3.v6}
                      {" available, "}
                      <b>
                        {"buy "}
                        {row3.v7}
                      </b>
                      {row3.choice8 === 0 ? <>{"; "}</> : null}
                    </Fragment>
                  ))
                ) : (
                  <></>
                )}
              </div>
              {"\n  "}
              {data.choice9 === 0 ? (
                <>
                  <div className={"small mt-s"}>
                    {"Waiting: "}
                    {data.rows10?.length ? (
                      data.rows10.map((row10, index) => (
                        <Fragment key={index}>
                          <a
                            href={
                              "/app/inventory/dispatch/" + text(row10.v11) + "/"
                            }
                          >
                            {row10.v12}
                            {" ("}
                            {row10.v13}
                            {")"}
                          </a>
                          {row10.choice14 === 0 ? <>{", "}</> : null}
                        </Fragment>
                      ))
                    ) : (
                      <></>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </>
      ) : null}
      {"\n"}
      <div className={"grid g-main"}>
        {"\n  "}
        <div className={"card"}>
          <div className={"card-h"}>
            <h2>{"Stock"}</h2>
            <span className={"muted small"}>
              {"Value at average cost "}
              {data.v15}
            </span>
          </div>
          <div className={"card-b tight tbl-wrap"}>
            <table className={"table"}>
              <thead>
                <tr>
                  <th>{"Item"}</th>
                  <th>{"Category"}</th>
                  <th className={"num"}>{"On hand"}</th>
                  <th className={"num"}>{"Promised"}</th>
                  <th className={"num"}>{"Available"}</th>
                  <th className={"num"}>{"Avg cost"}</th>
                </tr>
              </thead>
              <tbody>
                {data.rows16?.length ? (
                  data.rows16.map((row16, index) => (
                    <Fragment key={index}>
                      <tr className={row16.choice17 === 0 ? "loss" : ""}>
                        <td>
                          <b>{row16.v18}</b>{" "}
                          <span className={"muted small"}>{row16.v19}</span>
                          {row16.choice20 === 0 ? (
                            <>
                              {" "}
                              <span className={"badge b-blue"}>{"serial"}</span>
                            </>
                          ) : null}
                        </td>
                        <td className={"small"}>{row16.v21}</td>
                        <td className={"num"}>{row16.v22}</td>
                        <td className={"num"}>{row16.v23}</td>
                        <td className={"num"}>
                          {row16.choice24 === 0 ? (
                            <>
                              <span className={"badge b-red"}>{row16.v25}</span>
                            </>
                          ) : row16.choice24 === 1 ? (
                            <>
                              <span className={"badge b-amber"}>
                                {row16.v26}
                              </span>
                            </>
                          ) : row16.choice24 === 2 ? (
                            <>{row16.v27}</>
                          ) : null}
                        </td>
                        <td className={"num"}>{row16.v28}</td>
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
        {"\n  "}
        <div className={"card"}>
          <div className={"card-h"}>
            <h2>{"Recent receipts"}</h2>
          </div>
          <div className={"card-b"}>
            {data.rows29?.length ? (
              data.rows29.map((row29, index) => (
                <Fragment key={index}>
                  <div
                    className={"small"}
                    style={cssStyle(
                      "padding:.4rem 0;border-bottom:1px dashed var(--line)",
                    )}
                  >
                    <b>{row29.v30}</b>
                    {row29.choice31 === 0 ? (
                      <>
                        {" · "}
                        {row29.v32}
                      </>
                    ) : null}
                    <br />
                    <span className={"muted"}>
                      {row29.v33}
                      {" · "}
                      {row29.rows34?.length ? (
                        row29.rows34.map((row34, index) => (
                          <Fragment key={index}>
                            {row34.v35}
                            {" × "}
                            {row34.v36}
                            {row34.choice37 === 0 ? <>{", "}</> : null}
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
