// Native React page. Data contract: backoffice/dispatches.
import { Fragment, text } from "@ui/runtime";
export default function Page({ data, state }) {
  return (
    <>
      {"\n"}
      <div className={"page-head"}>
        <div>
          <h1>{"Pick lists and dispatch"}</h1>
          <div className={"sub"}>
            {
              "Created automatically when an order is confirmed. Nothing leaves the warehouse until every serial is scanned."
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
                href={"?status=" + text(row1.v2)}
                className={row1.choice3 === 0 ? "active" : ""}
              >
                {row1.v4}
              </a>
            </Fragment>
          ))
        ) : (
          <></>
        )}
      </div>
      {"\n"}
      <div className={"card"}>
        <div className={"card-b tight tbl-wrap"}>
          <table className={"table"}>
            <thead>
              <tr>
                <th>{"Pick list"}</th>
                <th>{"Customer"}</th>
                <th>{"Order"}</th>
                <th>{"Items"}</th>
                <th>{"Status"}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.rows5?.length ? (
                data.rows5.map((row5, index) => (
                  <Fragment key={index}>
                    <tr>
                      <td className={"mono"}>
                        <a
                          href={
                            "/app/inventory/dispatch/" + text(row5.v6) + "/"
                          }
                        >
                          {row5.v7}
                        </a>
                      </td>
                      <td>
                        {row5.v8}
                        <div className={"tiny faint"}>{row5.v9}</div>
                      </td>
                      <td>{row5.v10}</td>
                      <td>{row5.v11}</td>
                      <td>
                        <span className={"badge " + text(row5.v12)}>
                          {row5.v13}
                        </span>
                      </td>
                      <td className={"right"}>
                        <a
                          className={"btn btn-line btn-sm"}
                          href={
                            "/app/inventory/dispatch/" + text(row5.v14) + "/"
                          }
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
                    <td colSpan={"6"} className={"empty"}>
                      {"Nothing here."}
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
