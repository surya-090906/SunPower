// Native React page. Data contract: backoffice/tabs/dispatch.
import { Fragment, text } from "@ui/runtime";
export default function Page({ data, state }) {
  return (
    <>
      {data.rows1?.length ? (
        data.rows1.map((row1, index) => (
          <Fragment key={index}>
            {"\n"}
            <div className={"card mb"}>
              <div className={"card-h"}>
                <div className={"row"}>
                  <h2>{row1.v2}</h2>
                  <span className={"badge " + text(row1.v3)}>{row1.v4}</span>
                </div>
                {"\n  "}
                <div className={"row"}>
                  {row1.choice5 === 0 ? (
                    <>
                      <a
                        className={"btn btn-line btn-sm"}
                        href={"/doc/delivery/" + text(row1.v6) + "/"}
                      >
                        {"Delivery note"}
                      </a>
                    </>
                  ) : null}
                  {"\n  "}
                  {row1.choice7 === 0 ? (
                    <>
                      <a
                        className={"btn btn-dark btn-sm"}
                        href={"/app/inventory/dispatch/" + text(row1.v8) + "/"}
                      >
                        {"Open pick screen"}
                      </a>
                    </>
                  ) : null}
                </div>
              </div>
              {"\n"}
              <div className={"card-b tight tbl-wrap"}>
                <table className={"table"}>
                  <thead>
                    <tr>
                      <th>{"Item"}</th>
                      <th className={"num"}>{"Required"}</th>
                      <th className={"num"}>{"Picked"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {row1.rows9?.length ? (
                      row1.rows9.map((row9, index) => (
                        <Fragment key={index}>
                          <tr>
                            <td>
                              {row9.v10}
                              {row9.choice11 === 0 ? (
                                <>
                                  {" "}
                                  <span className={"badge b-blue"}>
                                    {"serial"}
                                  </span>
                                </>
                              ) : null}
                            </td>
                            <td className={"num"}>{row9.v12}</td>
                            <td className={"num"}>
                              {row9.choice13 === 0 ? (
                                <>
                                  <span className={"badge b-green"}>
                                    {row9.v14}
                                  </span>
                                </>
                              ) : row9.choice13 === 1 ? (
                                <>{row9.v15}</>
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
              {"\n"}
              <div className={"card-b small muted"}>
                {row1.choice16 === 0 ? (
                  <>
                    {"Dispatched "}
                    {row1.v17}
                    {row1.choice18 === 0 ? (
                      <>
                        {" · "}
                        {row1.v19}
                      </>
                    ) : null}
                    {row1.choice20 === 0 ? (
                      <>
                        {" · "}
                        {row1.v21}
                      </>
                    ) : null}
                  </>
                ) : null}
                {row1.choice22 === 0 ? (
                  <>
                    {" · delivered "}
                    {row1.v23}
                    {row1.choice24 === 0 ? (
                      <>
                        {" · received by "}
                        {row1.v25}
                      </>
                    ) : null}
                  </>
                ) : null}
                {row1.choice26 === 0 ? (
                  <>
                    {" · value on truck "}
                    {row1.v27}
                    {" at cost"}
                  </>
                ) : null}
              </div>
            </div>
            {"\n"}
          </Fragment>
        ))
      ) : (
        <>
          <div className={"gate"}>
            {
              "The pick list is created automatically when the advance is received and the order is confirmed."
            }
          </div>
        </>
      )}
      {"\n"}
    </>
  );
}
