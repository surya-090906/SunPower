// Native React page. Data contract: backoffice/insights.
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
      {"\n"}
      <div className={"page-head"}>
        <div>
          <h1>{"Director dashboard"}</h1>
          <div className={"sub"}>
            {
              "Which installations made money, what is unfinished, and what needs chasing. "
            }
            {data.v1}
            {", up to now."}
          </div>
        </div>
        {"\n  "}
        <div className={"row"}>
          <div className={"tabs"} style={cssStyle("margin:0;border:0")}>
            {data.rows2?.length ? (
              data.rows2.map((row2, index) => (
                <Fragment key={index}>
                  <a
                    href={"?window=" + text(row2.v3)}
                    className={row2.choice4 === 0 ? "active" : ""}
                  >
                    {row2.v5}
                  </a>
                </Fragment>
              ))
            ) : (
              <></>
            )}
          </div>
        </div>
      </div>
      {"\n\n"}
      <div className={"grid g4 mb"}>
        {"\n  "}
        {data.rows6?.length ? (
          data.rows6.map((row6, index) => (
            <Fragment key={index}>
              <div className={"card kpi"}>
                <div className={"label"}>{row6.v7}</div>
                <div
                  className={"val"}
                  {...(row6.attr8 === 0
                    ? { style: cssStyle("color:var(--red)") }
                    : {})}
                >
                  {row6.v9}
                </div>
                {"\n    "}
                <div className={"small muted"}>{row6.v10}</div>
                {row6.choice11 === 0 ? (
                  <>
                    <div className={"delta " + text(row6.v12)}>{row6.v13}</div>
                  </>
                ) : null}
              </div>
            </Fragment>
          ))
        ) : (
          <></>
        )}
        {"\n"}
      </div>
      {"\n\n"}
      <div className={"card mb"}>
        {"\n  "}
        <div className={"card-h spread"}>
          {"\n    "}
          <div>
            {"\n      "}
            <h2>{"Weekly revenue trend"}</h2>
            {"\n      "}
            <span className={"small muted"}>
              {"Revenue on completed jobs over the last 6 weeks · peak "}
              {data.v14}
            </span>
            {"\n    "}
          </div>
          {"\n  "}
        </div>
        {"\n  "}
        <div className={"card-b"} style={cssStyle("padding-bottom:.8rem")}>
          {"\n    "}
          <div style={cssStyle("width:100%;overflow-x:auto")}>
            {"\n      "}
            <svg
              viewBox={"0 0 640 140"}
              style={cssStyle(
                "width:100%;max-width:720px;height:auto;display:block;margin:0 auto",
              )}
            >
              {"\n        "}
              <line
                x1={"20"}
                y1={"112"}
                x2={"620"}
                y2={"112"}
                stroke={"var(--line)"}
                strokeDasharray={"2 2"}
              />
              {"\n        "}
              {data.rows15?.length ? (
                data.rows15.map((row15, index) => (
                  <Fragment key={index}>
                    {"\n          "}
                    <g>
                      {"\n            "}
                      <rect
                        x={text(row15.v16)}
                        y={text(row15.v17)}
                        width={text(row15.v18)}
                        height={text(row15.v19)}
                        rx={"4"}
                        fill={"var(--brand)"}
                        opacity={
                          row15.choice20 === 0
                            ? "0.92"
                            : row15.choice20 === 1
                              ? "0.35"
                              : ""
                        }
                      >
                        {"\n              "}
                        <title>
                          {row15.v21}
                          {": "}
                          {row15.v22}
                          {" ("}
                          {row15.v23}
                          {" jobs)"}
                        </title>
                        {"\n            "}
                      </rect>
                      {"\n            "}
                      <text
                        x={text(row15.v24)}
                        y={text(row15.v25)}
                        textAnchor={"middle"}
                        fontSize={"10.5"}
                        fontWeight={"600"}
                        fill={"var(--ink)"}
                      >
                        {row15.v26}
                      </text>
                      {"\n            "}
                      <text
                        x={text(row15.v27)}
                        y={text(row15.v28)}
                        textAnchor={"middle"}
                        fontSize={"10"}
                        fill={"var(--ink-2)"}
                      >
                        {row15.v29}
                        {" ("}
                        {row15.v30}
                        {" jobs)"}
                      </text>
                      {"\n          "}
                    </g>
                    {"\n        "}
                  </Fragment>
                ))
              ) : (
                <></>
              )}
              {"\n      "}
            </svg>
            {"\n    "}
          </div>
          {"\n  "}
        </div>
        {"\n"}
      </div>
      {"\n\n"}
      <div className={"card mb"}>
        <div className={"card-h"}>
          <h2>{"Which installations made money"}</h2>
          <span className={"small muted"}>
            {"Jobs signed off "}
            {data.v31}
            {". Profit keeps moving: a later free repair lowers it."}
          </span>
        </div>
        {"\n  "}
        <div className={"card-b tight tbl-wrap"}>
          <table className={"table"}>
            <thead>
              <tr>
                <th>{"Job"}</th>
                <th>{"System"}</th>
                <th>{"Installed"}</th>
                <th className={"num"}>{"Revenue"}</th>
                <th className={"num"}>{"Materials"}</th>
                <th className={"num"}>{"Labour"}</th>
                <th className={"num"}>{"Warranty / other"}</th>
                <th className={"num"}>{"Profit"}</th>
                <th className={"num"}>{"Margin"}</th>
              </tr>
            </thead>
            <tbody>
              {data.rows32?.length ? (
                data.rows32.map((row32, index) => (
                  <Fragment key={index}>
                    <tr className={row32.choice33 === 0 ? "loss" : ""}>
                      <td>
                        <a href={"/app/insights/p/" + text(row32.v34) + "/"}>
                          <b>{row32.v35}</b>
                        </a>
                        <div className={"tiny faint mono"}>{row32.v36}</div>
                      </td>
                      <td>
                        {row32.v37}
                        {" kW "}
                        {row32.v38}
                      </td>
                      <td className={"small"}>{row32.v39}</td>
                      <td className={"num"}>{row32.v40}</td>
                      <td className={"num"}>{row32.v41}</td>
                      <td className={"num"}>{row32.v42}</td>
                      <td className={"num"}>
                        {row32.choice43 === 0 ? (
                          <>{row32.v44}</>
                        ) : row32.choice43 === 1 ? (
                          <>{"–"}</>
                        ) : null}
                      </td>
                      <td
                        className={"num bold"}
                        style={cssStyle(
                          "color:" +
                            (row32.choice45 === 0
                              ? "var(--red)"
                              : row32.choice45 === 1
                                ? "var(--green)"
                                : ""),
                        )}
                      >
                        {row32.v46}
                      </td>
                      <td className={"num"}>
                        {row32.choice47 === 0 ? (
                          <>
                            <span
                              className={
                                "badge " +
                                (row32.choice48 === 0
                                  ? "b-red"
                                  : row32.choice48 === 1
                                    ? "b-amber"
                                    : row32.choice48 === 2
                                      ? "b-green"
                                      : "")
                              }
                            >
                              {row32.v49}
                              {"%"}
                            </span>
                          </>
                        ) : null}
                      </td>
                    </tr>
                  </Fragment>
                ))
              ) : (
                <>
                  <tr>
                    <td colSpan={"9"} className={"empty"}>
                      {"No installations signed off "}
                      {data.v50}
                      {". Try a longer window."}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {"\n\n"}
      <div className={"grid g2 mb"}>
        {"\n  "}
        <div className={"card"}>
          <div className={"card-h"}>
            <h2>{"What is unfinished"}</h2>
            <span className={"small muted"}>
              {"Pipeline value "}
              {data.v51}
            </span>
          </div>
          <div className={"card-b bars"}>
            {"\n    "}
            {data.rows52?.length ? (
              data.rows52.map((row52, index) => (
                <Fragment key={index}>
                  <div className={"bar-row"}>
                    <span>{row52.v53}</span>
                    <span className={"track"}>
                      <i style={cssStyle("width:" + text(row52.v54) + "%")}></i>
                    </span>
                    <span className={"right small"}>
                      <b>{row52.v55}</b>
                      {" · "}
                      {row52.v56}
                    </span>
                  </div>
                </Fragment>
              ))
            ) : (
              <></>
            )}
          </div>
        </div>
        {"\n  "}
        <div className={"card"}>
          <div className={"card-h"}>
            <h2>{"Stuck projects"}</h2>
            <span className={"small muted"}>
              {"Next step older than its limit"}
            </span>
          </div>
          <div className={"card-b tight tbl-wrap"}>
            <table className={"table"}>
              <tbody>
                {data.rows57?.length ? (
                  data.rows57.map((row57, index) => (
                    <Fragment key={index}>
                      <tr>
                        <td>
                          <a href={"/app/p/" + text(row57.v58) + "/"}>
                            <b>{row57.v59}</b>
                          </a>
                          <div className={"tiny faint"}>{row57.v60}</div>
                        </td>
                        <td className={"small"}>
                          {row57.v61}
                          <div className={"tiny faint"}>{row57.v62}</div>
                        </td>
                        <td className={"nowrap"}>
                          {row57.choice63 === 0 ? (
                            <>
                              <span className={"badge b-red"}>{"overdue"}</span>
                            </>
                          ) : row57.choice63 === 1 ? (
                            <>
                              <span
                                className={
                                  "badge " +
                                  (row57.choice64 === 0
                                    ? "b-red"
                                    : row57.choice64 === 1
                                      ? "b-amber"
                                      : "")
                                }
                              >
                                {row57.v65}
                                {" d"}
                              </span>
                            </>
                          ) : null}
                        </td>
                      </tr>
                    </Fragment>
                  ))
                ) : (
                  <>
                    <tr>
                      <td className={"empty"}>{"Nothing is stuck."}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {"\n"}
      </div>
      {"\n\n"}
      <div className={"grid g2 mb"}>
        {"\n  "}
        <div className={"card"}>
          <div className={"card-h"}>
            <h2>{"Repairs still open"}</h2>
            <a className={"small"} href={"/app/help/tickets/"}>
              {"All tickets"}
            </a>
          </div>
          <div className={"card-b tight tbl-wrap"}>
            <table className={"table"}>
              <tbody>
                {data.rows66?.length ? (
                  data.rows66.map((row66, index) => (
                    <Fragment key={index}>
                      <tr>
                        <td>
                          <a
                            className={"mono"}
                            href={"/app/help/tickets/" + text(row66.v67) + "/"}
                          >
                            {row66.v68}
                          </a>
                        </td>
                        <td>
                          {row66.v69}
                          <div className={"tiny faint"}>{row66.v70}</div>
                        </td>
                        <td>
                          {row66.choice71 === 0 ? (
                            <>
                              <span className={"badge b-green"}>
                                {"Warranty"}
                              </span>
                            </>
                          ) : row66.choice71 === 1 ? (
                            <>
                              <span className={"badge b-red"}>
                                {"Billable"}
                              </span>
                            </>
                          ) : null}
                        </td>
                        <td>
                          <span className={"badge " + text(row66.v72)}>
                            {row66.v73}
                          </span>
                          {row66.choice74 === 0 ? (
                            <>
                              <div
                                className={"tiny"}
                                style={cssStyle("color:var(--amber)")}
                              >
                                {"awaiting customer"}
                              </div>
                            </>
                          ) : null}
                        </td>
                        <td className={"small muted nowrap"}>
                          {row66.v75}
                          {" d"}
                        </td>
                      </tr>
                    </Fragment>
                  ))
                ) : (
                  <>
                    <tr>
                      <td className={"empty"}>{"No open repairs."}</td>
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
            <h2>{"Money to chase and pay"}</h2>
            <a className={"small"} href={"/app/accounts/"}>
              {"Accounting"}
            </a>
          </div>
          <div className={"card-b"}>
            {"\n    "}
            <div className={"spread"}>
              <span className={"muted"}>{"Outstanding balances"}</span>
              <b>{data.v76}</b>
            </div>
            {"\n    "}
            {data.rows77?.length ? (
              data.rows77.map((row77, index) => (
                <Fragment key={index}>
                  <div
                    className={"spread small"}
                    style={cssStyle("padding:.2rem 0")}
                  >
                    <span>
                      {row77.v78}
                      {" · "}
                      {row77.v79}
                    </span>
                    <span>
                      {row77.v80}
                      {row77.choice81 === 0 ? (
                        <>
                          {" "}
                          <span className={"badge b-red"}>
                            {row77.v82}
                            {" d late"}
                          </span>
                        </>
                      ) : null}
                    </span>
                  </div>
                </Fragment>
              ))
            ) : (
              <></>
            )}
            {"\n    "}
            <hr />
            <div className={"spread"}>
              <span className={"muted"}>
                {"Payments awaiting verification"}
              </span>
              <b>{data.v83}</b>
            </div>
            {"\n    "}
            <div className={"spread"}>
              <span className={"muted"}>{"Subsidy steps open"}</span>
              <b>{data.v84}</b>
            </div>
            {"\n    "}
            <div className={"spread"}>
              <span className={"muted"}>
                {"Technician pay, "}
                {data.v85}
              </span>
              <b>{data.v86}</b>
            </div>
            {"\n    "}
            <div className={"spread"}>
              <span className={"muted"}>{"Stock value"}</span>
              <b>{data.v87}</b>
            </div>
            {"\n    "}
            {data.rows88?.length ? (
              data.rows88.map((row88, index) => (
                <Fragment key={index}>
                  <div className={"gate mt-s"}>
                    {"⚠ Short on "}
                    {row88.v89}
                    {": buy "}
                    {row88.v90}
                  </div>
                </Fragment>
              ))
            ) : (
              <></>
            )}
          </div>
        </div>
        {"\n"}
      </div>
      {"\n\n"}
      <div className={"card"}>
        <div className={"card-h"}>
          <h2>{"Share these numbers"}</h2>
        </div>
        <div className={"card-b"}>
          {"\n  "}
          <div className={"row"}>
            {"\n    "}
            <ActionForm method={"post"} action={"/app/insights/share/"}>
              <CsrfField />
              <Field type={"hidden"} name={"window"} value={text(data.v91)} />
              <button className={"btn btn-primary"}>
                {"Create a shareable snapshot (7 days)"}
              </button>
            </ActionForm>
            {"\n    "}
            <a
              className={"btn btn-line"}
              href={"/app/insights/export.csv?window=" + text(data.v92)}
            >
              {"Download jobs as CSV"}
            </a>
            {"\n    "}
            {data.choice93 === 0 ? (
              <>
                <a
                  className={"btn btn-ok"}
                  href={text(data.v94)}
                  target={"_blank"}
                  rel={"noopener"}
                >
                  {"Send summary on WhatsApp"}
                </a>
              </>
            ) : null}
            {"\n  "}
          </div>
          {"\n  "}
          {data.choice95 === 0 ? (
            <>
              <div className={"banner info mt"}>
                <div
                  className={"small"}
                  style={cssStyle("word-break:break-all")}
                >
                  <b>{"Read-only link:"}</b>{" "}
                  <a href={text(data.v96)} target={"_blank"}>
                    {data.v97}
                  </a>
                  <br />
                  {
                    "Customer names are shortened. The link expires in 7 days and shows the numbers as they are now."
                  }
                </div>
              </div>
            </>
          ) : null}
          {"\n"}
        </div>
      </div>
      {"\n"}
    </>
  );
}
