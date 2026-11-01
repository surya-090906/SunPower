// Native React page. Data contract: public/share.
import { Fragment, cssStyle } from "@ui/runtime";
export default function Page({ data, state }) {
  return (
    <>
      {"\n"}
      {data.choice1 === 0 ? (
        <>
          {"\n"}
          <div className={"card"}>
            <div className={"card-b center"}>
              <h1>{"This link has expired"}</h1>
              <p className={"muted mt-s"}>
                {"Snapshot links work for 7 days. Ask for a fresh one."}
              </p>
            </div>
          </div>
          {"\n"}
        </>
      ) : data.choice1 === 1 ? (
        <>
          {"\n"}
          <div className={"mb"}>
            <h1>
              {data.v2}
              {": "}
              {data.v3}
            </h1>
            <div className={"muted small"}>
              {"Read-only snapshot · "}
              {data.v4}
              {" · customer names are shortened"}
            </div>
          </div>
          {"\n"}
          <div className={"grid g2 mb"}>
            {data.rows5?.length ? (
              data.rows5.map((row5, index) => (
                <Fragment key={index}>
                  <div className={"pcard"}>
                    <div className={"small muted bold"}>{row5.v6}</div>
                    <div style={cssStyle("font-size:1.5rem;font-weight:800")}>
                      {row5.v7}
                    </div>
                    <div className={"small muted"}>
                      {row5.v8}
                      {row5.choice9 === 0 ? (
                        <>
                          {" · "}
                          {row5.v10}
                        </>
                      ) : null}
                    </div>
                  </div>
                </Fragment>
              ))
            ) : (
              <></>
            )}
          </div>
          {"\n"}
          <div className={"pcard mb"} style={cssStyle("padding:0")}>
            <div
              style={cssStyle(
                "padding:.9rem 1.1rem;border-bottom:1px solid var(--line)",
              )}
            >
              <h3>{"Jobs completed"}</h3>
            </div>
            <div className={"tbl-wrap"}>
              <table className={"table"}>
                <thead>
                  <tr>
                    <th>{"Customer"}</th>
                    <th>{"System"}</th>
                    <th className={"num"}>{"Revenue"}</th>
                    <th className={"num"}>{"Profit"}</th>
                    <th className={"num"}>{"Margin"}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows11?.length ? (
                    data.rows11.map((row11, index) => (
                      <Fragment key={index}>
                        <tr className={row11.choice12 === 0 ? "loss" : ""}>
                          <td>{row11.v13}</td>
                          <td>
                            {row11.v14}
                            {" kW "}
                            {row11.v15}
                          </td>
                          <td className={"num"}>{row11.v16}</td>
                          <td className={"num bold"}>{row11.v17}</td>
                          <td className={"num"}>{row11.v18}</td>
                        </tr>
                      </Fragment>
                    ))
                  ) : (
                    <>
                      <tr>
                        <td colSpan={"5"} className={"empty"}>
                          {"None in this period."}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {"\n"}
          <div className={"grid g2"}>
            {"\n  "}
            <div className={"pcard"} style={cssStyle("padding:0")}>
              <div
                style={cssStyle(
                  "padding:.9rem 1.1rem;border-bottom:1px solid var(--line)",
                )}
              >
                <h3>{"Pipeline"}</h3>
              </div>
              <div className={"tbl-wrap"}>
                <table className={"table"}>
                  <tbody>
                    {data.rows19?.length ? (
                      data.rows19.map((row19, index) => (
                        <Fragment key={index}>
                          <tr>
                            <td>{row19.v20}</td>
                            <td className={"num"}>{row19.v21}</td>
                            <td className={"num"}>{row19.v22}</td>
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
            <div className={"pcard"} style={cssStyle("padding:0")}>
              <div
                style={cssStyle(
                  "padding:.9rem 1.1rem;border-bottom:1px solid var(--line)",
                )}
              >
                <h3>{"Open repairs"}</h3>
              </div>
              <div className={"tbl-wrap"}>
                <table className={"table"}>
                  <tbody>
                    {data.rows23?.length ? (
                      data.rows23.map((row23, index) => (
                        <Fragment key={index}>
                          <tr>
                            <td className={"mono"}>{row23.v24}</td>
                            <td>{row23.v25}</td>
                            <td>{row23.v26}</td>
                            <td className={"num"}>
                              {row23.v27}
                              {" d"}
                            </td>
                          </tr>
                        </Fragment>
                      ))
                    ) : (
                      <>
                        <tr>
                          <td className={"empty"}>{"None."}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
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
