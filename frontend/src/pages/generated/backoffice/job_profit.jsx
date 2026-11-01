// Native React page. Data contract: backoffice/job_profit.
import { Fragment, cssStyle, text } from "@ui/runtime";
export default function Page({ data, state }) {
  return (
    <>
      {"\n"}
      <div className={"page-head"}>
        <div>
          <a className={"small"} href={"/app/insights/"}>
            {"‹ Dashboard"}
          </a>
          <h1 style={cssStyle("margin-top:.3rem")}>{data.v1}</h1>
          <div className={"sub"}>
            <span className={"mono"}>{data.v2}</span>
            {" · "}
            {data.v3}
            {" · "}
            <a href={"/app/p/" + text(data.v4) + "/"}>{"Open project"}</a>
          </div>
        </div>
        {"\n  "}
        <div className={"kpi card"} style={cssStyle("padding:.7rem 1.1rem")}>
          <div className={"label"}>
            {data.choice5 === 0 ? (
              <>{"Estimated profit"}</>
            ) : data.choice5 === 1 ? (
              <>{"Profit to date"}</>
            ) : null}
          </div>
          <div
            className={"val"}
            style={cssStyle(
              "color:" +
                (data.choice6 === 0
                  ? "var(--red)"
                  : data.choice6 === 1
                    ? "var(--green)"
                    : ""),
            )}
          >
            {data.v7}
            {data.choice8 === 0 ? (
              <>
                {" "}
                <span className={"small"}>
                  {"("}
                  {data.v9}
                  {"%)"}
                </span>
              </>
            ) : null}
          </div>
        </div>
      </div>
      {"\n"}
      <div className={"grid g-main"}>
        {"\n  "}
        <div className={"card"}>
          <div className={"card-h"}>
            <h2>{"Where the money went"}</h2>
            {data.choice10 === 0 ? (
              <>
                <span className={"badge b-amber"}>
                  {"estimate until installed"}
                </span>
              </>
            ) : null}
          </div>
          <div className={"card-b"}>
            {"\n    "}
            <svg
              className={"wf"}
              viewBox={"0 0 " + text(data.v11) + " " + text(data.v12)}
              width={"100%"}
              role={"img"}
              aria-label={"Profit waterfall"}
            >
              {"\n      "}
              {data.rows13?.length ? (
                data.rows13.map((row13, index) => (
                  <Fragment key={index}>
                    <rect
                      x={text(row13.v14)}
                      y={text(row13.v15)}
                      width={text(row13.v16)}
                      height={text(row13.v17)}
                      rx={"5"}
                      fill={text(row13.v18)}
                    />
                    {"\n      "}
                    <text
                      x={text(row13.v19)}
                      y={text(row13.v20)}
                      textAnchor={"middle"}
                      fontSize={"12"}
                      fontWeight={"700"}
                      fill={"currentColor"}
                    >
                      {row13.v21}
                    </text>
                    {"\n      "}
                    <text
                      x={text(row13.v22)}
                      y={text(row13.v23)}
                      textAnchor={"middle"}
                      fontSize={"11"}
                      fill={"currentColor"}
                      opacity={".65"}
                    >
                      {row13.v24}
                    </text>
                  </Fragment>
                ))
              ) : (
                <></>
              )}
              {"\n    "}
            </svg>
          </div>
        </div>
        {"\n  "}
        <div className={"card"}>
          <div className={"card-h"}>
            <h2>{"Breakdown"}</h2>
          </div>
          <div className={"card-b small"}>
            {"\n    "}
            <div className={"spread"}>
              <span>{"Revenue (ex-GST)"}</span>
              <b>{data.v25}</b>
            </div>
            <div className={"spread"}>
              <span className={"muted"}>{"Materials"}</span>
              <span>
                {"-"}
                {data.v26}
              </span>
            </div>
            <div className={"spread"}>
              <span className={"muted"}>{"Labour"}</span>
              <span>
                {"-"}
                {data.v27}
              </span>
            </div>
            {"\n    "}
            <div className={"spread"}>
              <span className={"muted"}>{"Warranty repairs"}</span>
              <span>
                {"-"}
                {data.v28}
              </span>
            </div>
            <div className={"spread"}>
              <span className={"muted"}>{"Billed service costs"}</span>
              <span>
                {"-"}
                {data.v29}
              </span>
            </div>
            <div className={"spread"}>
              <span className={"muted"}>{"Other costs"}</span>
              <span>
                {"-"}
                {data.v30}
              </span>
            </div>
            {"\n    "}
            <div
              className={"spread bold"}
              style={cssStyle(
                "border-top:2px solid var(--ink);margin-top:.4rem;padding-top:.4rem",
              )}
            >
              <span>{"Profit"}</span>
              <span>{data.v31}</span>
            </div>
            {"\n    "}
            {data.choice32 === 0 ? (
              <>
                <hr />
                <div
                  className={"muted tiny"}
                  style={cssStyle(
                    "text-transform:uppercase;letter-spacing:.06em",
                  )}
                >
                  {"After-sales"}
                </div>
                {data.rows33?.length ? (
                  data.rows33.map((row33, index) => (
                    <Fragment key={index}>
                      <div className={"spread"}>
                        <a href={"/app/help/tickets/" + text(row33.v34) + "/"}>
                          {row33.v35}
                        </a>
                        <span>
                          {row33.choice36 === 0 ? (
                            <>
                              <span className={"badge b-green"}>
                                {"warranty"}
                              </span>
                            </>
                          ) : row33.choice36 === 1 ? (
                            <>
                              <span className={"badge b-grey"}>{"billed"}</span>
                            </>
                          ) : null}
                        </span>
                      </div>
                    </Fragment>
                  ))
                ) : (
                  <></>
                )}
              </>
            ) : null}
          </div>
        </div>
        {"\n"}
      </div>
      {"\n"}
      <div className={"card mt"}>
        <div className={"card-h"}>
          <h2>{"Ledger"}</h2>
          <span className={"small muted"}>
            {"Every rupee in or out is written once, here."}
          </span>
        </div>
        <div className={"card-b tight tbl-wrap"}>
          <table className={"table"}>
            <thead>
              <tr>
                <th>{"Date"}</th>
                <th>{"Kind"}</th>
                <th>{"Category"}</th>
                <th>{"Note"}</th>
                <th className={"num"}>{"Amount"}</th>
              </tr>
            </thead>
            <tbody>
              {data.rows37?.length ? (
                data.rows37.map((row37, index) => (
                  <Fragment key={index}>
                    <tr>
                      <td className={"small muted"}>{row37.v38}</td>
                      <td>
                        <span
                          className={
                            "badge " +
                            (row37.choice39 === 0
                              ? "b-green"
                              : row37.choice39 === 1
                                ? "b-grey"
                                : "")
                          }
                        >
                          {row37.v40}
                        </span>
                      </td>
                      <td>{row37.v41}</td>
                      <td className={"small"}>{row37.v42}</td>
                      <td className={"num"}>
                        {row37.choice43 === 0 ? <>{"-"}</> : null}
                        {row37.v44}
                      </td>
                    </tr>
                  </Fragment>
                ))
              ) : (
                <>
                  <tr>
                    <td colSpan={"5"} className={"empty"}>
                      {
                        "Nothing is booked yet: revenue and labour post when the install is signed off."
                      }
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {"\n"}
    </>
  );
}
