// Native React page. Data contract: backoffice/tickets.
import { Fragment, cssStyle, text } from "@ui/runtime";
export default function Page({ data, state }) {
  return (
    <>
      {"\n"}
      <div className={"page-head"}>
        <div>
          <a className={"small"} href={"/app/help/"}>
            {"‹ Helpdesk"}
          </a>
          <h1 style={cssStyle("margin-top:.3rem")}>{"Service tickets"}</h1>
          <div className={"sub"}>
            {
              "A ticket stays open until the customer confirms that everything works."
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
                <th>{"Ticket"}</th>
                <th>{"Customer"}</th>
                <th>{"Unit"}</th>
                <th>{"Fault"}</th>
                <th>{"Cover"}</th>
                <th>{"Technician"}</th>
                <th>{"Status"}</th>
                <th>{"Opened"}</th>
              </tr>
            </thead>
            <tbody>
              {data.rows5?.length ? (
                data.rows5.map((row5, index) => (
                  <Fragment key={index}>
                    <tr>
                      <td>
                        <a
                          className={"mono"}
                          href={"/app/help/tickets/" + text(row5.v6) + "/"}
                        >
                          {row5.v7}
                        </a>
                        {row5.choice8 === 0 ? (
                          <>
                            {" "}
                            <span className={"badge b-red"}>
                              {"reopened ×"}
                              {row5.v9}
                            </span>
                          </>
                        ) : null}
                      </td>
                      <td>{row5.v10}</td>
                      <td>{row5.v11}</td>
                      <td>{row5.v12}</td>
                      <td>
                        {row5.choice13 === 0 ? (
                          <>
                            <span className={"badge b-green"}>
                              {"Warranty"}
                            </span>
                          </>
                        ) : row5.choice13 === 1 ? (
                          <>
                            <span className={"badge b-red"}>{"Billable"}</span>
                          </>
                        ) : row5.choice13 === 2 ? (
                          <>
                            <span className={"badge b-grey"}>
                              {"Unchecked"}
                            </span>
                          </>
                        ) : null}
                      </td>
                      <td>{row5.v14}</td>
                      <td>
                        <span className={"badge " + text(row5.v15)}>
                          {row5.v16}
                        </span>
                      </td>
                      <td className={"small muted"}>{row5.v17}</td>
                    </tr>
                  </Fragment>
                ))
              ) : (
                <>
                  <tr>
                    <td colSpan={"8"} className={"empty"}>
                      {"No tickets here."}
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
